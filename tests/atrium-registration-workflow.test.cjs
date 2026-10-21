const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const base = resolve(__dirname, '..');
const read = p => readFileSync(resolve(base,p), 'utf8');
const workflow = read('.github/workflows/atrium-register.yml');
const pages = read('.github/workflows/pages.yml');
const game = read('atriumd.yaml');
const spec = read('looprd.yaml');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('.ziprunner-workboard-update.json'));

test('Life registers only an exact successfully deployed main-branch GitHub Pages SHA', () => {
 assert.match(pages, /^name: Deploy The Life Loop to GitHub Pages$/m);
 assert.match(workflow, /workflows: \['Deploy The Life Loop to GitHub Pages'\]/);
 assert.match(workflow, /workflow_run:[\s\S]*types: \[completed\]/);
 assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
 assert.match(workflow, /github\.event\.workflow_run\.head_branch == 'main'/);
 assert.match(workflow, /github\.event\.workflow_run\.head_sha/);
 assert.match(workflow, /workflow_dispatch:/);
 assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
 assert.match(workflow, /ref: \$\{\{ github\.event_name == 'workflow_run' && github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/);
});

test('Registration uses pinned reviewed Atrium action and does not grant Life write credentials', () => {
 assert.match(workflow, /TheBigTreeInc\/atrium\/\.github\/actions\/register-game@76c667c4a362e9fe12682b48749ba2382e5a66e4/);
 assert.match(workflow, /atrium-token: \$\{\{ secrets\.ATRIUM_REGISTRATION_TOKEN \}\}/);
 assert.match(workflow, /contents: read/);
 assert.doesNotMatch(workflow, /contents: write|actions: write|ATRIUM_TOKEN=|gh api|curl /);
 assert.match(workflow, /persist-credentials: false/);
 assert.match(workflow, /registration-sent != 'true'/);
 assert.match(workflow, /exit 1/);
});

test('Portable Life game metadata still references deployment-owned origin, not hardcoded URL', () => {
 assert.match(game, /schema: atriumd\/v1/);
 assert.match(game, /id: life\.loop/);
 assert.match(game, /originRef: game-web/);
 assert.match(game, /entrypoint: index\.html/);
 assert.doesNotMatch(game, /https?:\/\//);
 assert.match(spec, /component: the-life-loop/);
 assert.match(spec, new RegExp('release: '+pkg.version.replace(/\./g,'\\.')));
});

test('Versioned game ZIP includes reviewer checks but does not declare operator acceptance', () => {
 assert.equal(pkg.version,'0.5.98');
 assert.equal(manifest.version,pkg.version);
 assert.ok(manifest.remaining.some(item=>item.id === 'LL-356' && item.priority === 'high'));
 assert.ok(manifest.remaining.some(item=>item.id === 'LL-354'));
 assert.ok(manifest.remaining.some(item=>item.id === 'LL-355'));
 const release = JSON.parse(read('ziprunner-manifest.json'));
 assert.equal(release.release.requested,false);
 assert.equal(release.release.requires_operator_approval,true);
 const packager=read('tools/package-ziprunner.py');
 assert.match(packager, /\.github\/workflows\/atrium-register\.yml/);
 assert.match(packager, /tests\/atrium-registration-workflow\.test\.cjs/);
});
