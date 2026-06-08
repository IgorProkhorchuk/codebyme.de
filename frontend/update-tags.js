import fs from 'fs';
import path from 'path';

const contentDir = 'c:/Users/igorp/Documents/projects/codebyme/frontend/src/content/blog';

const defaultTags = {
    'git-fast-forward.md': "['git']",
    'git-multi-remote.md': "['git']",
    'limit-resources-docker.md': "['docker', 'containers']",
    'update-alternatives.md': "['linux']",
    'entropy.md': "['linux', 'security', 'entropy']",
    'two-fa.md': "['security', '2fa']"
};

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.md')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (!content.includes('tags:')) {
                const tags = defaultTags[file] || "['general']";
                content = content.replace(/category: '(.*?)'\r?\n/, `category: '$1'\ntags: ${tags}\n`);
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${file} with tags: ${tags}`);
            }
        }
    }
}

processDir(contentDir);
