const fs = require('fs').promises;
const path = require('path');

async function cleanup() {
    const sessionsPath = path.join(process.cwd(), 'sessions');
    try {
        await fs.rm(sessionsPath, { recursive: true, force: true });
        console.log('Sessions cleared successfully');
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Error clearing sessions:', error);
        }
    }
}

cleanup();