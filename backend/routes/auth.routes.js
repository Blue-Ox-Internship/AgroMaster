const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const { loginRules, registerRules } = require('../middleware/validate');
const User = require('../models/User');
const supabaseClient = require('../supabase/client');
const demoUsers = require('../config/demo-users');
const fallbackStore = require('../config/fallback-store');

const router = express.Router();
const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'agrodrop-dev-secret';
const supabaseConfigured = Boolean(
    supabaseClient
    && supabaseClient.from
    && supabaseClient.supabaseUrl
    && (supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey)
    && !String(supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey).includes('replace_with')
);

function createToken(user) {
    return jwt.sign(
        { user_id: user.user_id || user.id || user._id, email: user.email, role: user.role },
        DEFAULT_JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
}

function loginDemoUser(email, password) {
    const user = demoUsers.find((demoUser) => demoUser.email === email.toLowerCase() && demoUser.password === password);
    if (!user) return null;

    const { password: _password, ...safeUser } = user;
    return {
        status: 'success',
        message: 'Login successful',
        token: createToken(safeUser),
        user: safeUser
    };
}

async function findSupabaseUserByEmail(email) {
    if (!supabaseConfigured) return null;

    const { data, error } = await supabaseClient
        .from('users')
        .select('id, full_name, email, phone, business_name, role, is_active, password_hash')
        .eq('email', email.toLowerCase())
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function createSupabaseUser(userPayload) {
    if (!supabaseConfigured) return null;

    const { data, error } = await supabaseClient
        .from('users')
        .insert(userPayload)
        .select('id, full_name, email, phone, business_name, role, is_active')
        .single();

    if (error) throw error;
    return data;
}

function findFallbackUserByEmail(email) {
    return fallbackStore.listItems('users').find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function findFallbackUserById(id) {
    return fallbackStore.listItems('users').find((user) => String(user.user_id) === String(id)) || null;
}

async function isValidPassword(user, password) {
    if (!user || !password) return false;

    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
        return bcrypt.compare(password, user.password);
    }

    return String(user.password) === String(password);
}

// Register new user
router.post('/register', registerRules, async (req, res) => {
    try {
        const { full_name, email, phone, business_name, password, role } = req.body;

        // Validate required fields
        if (!full_name || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide full name, email, and password'
            });
        }

        if (supabaseConfigured) {
            const existingUser = await findSupabaseUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Email already registered'
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const user = await createSupabaseUser({
                full_name,
                email: email.toLowerCase(),
                phone,
                business_name,
                password_hash: passwordHash,
                role: role || 'Sales Attendant',
                is_active: true
            });

            const token = jwt.sign(
                { user_id: user.id, email: user.email, role: user.role },
                DEFAULT_JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRY || '7d' }
            );

            return res.status(201).json({
                status: 'success',
                message: 'User registered successfully',
                token,
                user: {
                    user_id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role
                }
            });
        }

        if (!req.app.locals.dbConnected) {
            const existingUser = findFallbackUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Email already registered'
                });
            }

            const createdUser = fallbackStore.createItem('users', {
                full_name,
                email: email.toLowerCase(),
                phone,
                business_name,
                password,
                role: role || 'Sales Attendant'
            });

            const token = createToken(createdUser);
            return res.status(201).json({
                status: 'success',
                message: 'User registered successfully',
                token,
                user: {
                    user_id: createdUser.user_id,
                    full_name: createdUser.full_name,
                    email: createdUser.email,
                    role: createdUser.role
                }
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'Email already registered'
            });
        }

        // Create new user
        const user = new User({
            full_name,
            email: email.toLowerCase(),
            phone,
            business_name,
            password,
            role: role || 'Sales Attendant'
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                user_id: user._id,
                email: user.email,
                role: user.role
            },
            DEFAULT_JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            token,
            user: {
                user_id: user._id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Login user
router.post('/login', loginRules, async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const password = String(req.body?.password || '').trim();

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide email and password'
            });
        }

        const demoLogin = loginDemoUser(email, password);
        if (demoLogin) {
            return res.json(demoLogin);
        }

        if (supabaseConfigured) {
            const user = await findSupabaseUserByEmail(email);

            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid email or password'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');

            if (!isPasswordValid) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid email or password'
                });
            }

            if (!user.is_active) {
                return res.status(403).json({
                    status: 'error',
                    message: 'This account has been deactivated'
                });
            }

            const token = jwt.sign(
                { user_id: user.id, email: user.email, role: user.role },
                DEFAULT_JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRY || '7d' }
            );

            return res.json({
                status: 'success',
                message: 'Login successful',
                token,
                user: {
                    user_id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    business_name: user.business_name,
                    role: user.role
                }
            });
        }

        if (!req.app.locals.dbConnected) {
            const fallbackUser = findFallbackUserByEmail(email);
            if (fallbackUser && (await isValidPassword(fallbackUser, password))) {
                const safeUser = {
                    user_id: fallbackUser.user_id,
                    full_name: fallbackUser.full_name,
                    email: fallbackUser.email,
                    phone: fallbackUser.phone,
                    business_name: fallbackUser.business_name,
                    role: fallbackUser.role
                };
                return res.json({
                    status: 'success',
                    message: 'Login successful',
                    token: createToken(safeUser),
                    user: safeUser
                });
            }

            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Find user and select password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Compare passwords
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                status: 'error',
                message: 'This account has been deactivated'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                user_id: user._id,
                email: user.email,
                role: user.role
            },
            DEFAULT_JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );

        res.json({
            status: 'success',
            message: 'Login successful',
            token,
            user: {
                user_id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                business_name: user.business_name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }

        if (supabaseConfigured) {
            const { data, error } = await supabaseClient
                .from('users')
                .select('id, full_name, email, phone, business_name, role, is_active')
                .eq('id', req.user.user_id)
                .maybeSingle();

            if (error || !data) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            return res.json({
                status: 'success',
                user: {
                    user_id: data.id,
                    full_name: data.full_name,
                    email: data.email,
                    phone: data.phone,
                    business_name: data.business_name,
                    role: data.role
                }
            });
        }

        if (!req.app.locals.dbConnected) {
            const fallbackUser = findFallbackUserById(req.user.user_id);
            if (!fallbackUser) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            return res.json({
                status: 'success',
                user: {
                    user_id: fallbackUser.user_id,
                    full_name: fallbackUser.full_name,
                    email: fallbackUser.email,
                    phone: fallbackUser.phone,
                    business_name: fallbackUser.business_name,
                    role: fallbackUser.role
                }
            });
        }

        const user = await User.findById(req.user.user_id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            user: {
                user_id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                business_name: user.business_name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
