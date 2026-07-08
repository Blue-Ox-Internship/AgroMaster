const path = require('path');
const { spawn } = require('child_process');

const backendDir = path.join(__dirname, 'backend');
const backendServer = path.join(backendDir, 'server.js');

const child = spawn(process.execPath, [backendServer], {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
});

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
    process.on(signal, () => {
        child.kill(signal);
    });
});

child.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
    } else {
        process.exit(code || 0);
    }
});

child.on('error', (error) => {
    console.error('Failed to start backend server:', error);
    process.exit(1);
});
