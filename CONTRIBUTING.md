# Contributing

This is a one-person project. I read every issue and every PR, but how fast I get back to you depends on what else is going on that week. Keep that in mind before you spend a lot of time on something.

## Setting up

You'll need Docker. Everything else (Postgres, MinIO, Redis, the collab server, Caddy in prod) is in compose.

```bash
git clone https://github.com/emmayusufu/lumen.git
cd lumen
cp .env.example .env
docker compose up --build
```

Open http://localhost:3847 and sign up. Settings → API Keys to drop in a DeepSeek key if you want to play with the AI features.

If you'd rather run the apps natively for faster iteration, the README has the without-Docker section. Postgres, MinIO, and the collab service still need to be up somewhere. I usually run those in compose and run `web` and `research-api` natively.

## Running tests

Backend:

```bash
cd apps/backend
pip install -r requirements.txt
pytest
```

Frontend:

```bash
cd apps/web
npm install
npm run lint
npm run build
npx playwright test
```

Load tests are in `load/`. Run with `k6 run load/<name>.js` against a running stack.

## Style

Backend: ruff. Run `ruff check . && ruff format .` before committing.

Frontend: ESLint + Prettier, both wired up. `npm run lint` will tell you what's off.

I keep comments to a minimum. If a function name explains what it does, don't write a docstring. Comments are for things that aren't obvious from the code: a hidden constraint, a workaround for a specific bug, a deliberate non-obvious choice. If you're tempted to write "this function returns X", delete it.

Same logic with type annotations. I want them where they help. I don't want them where they're just restating what's obvious from the value.

## What gets merged

Things that land easily:

* Bug fixes with a clear reproduction
* Small UX polish (better error messages, less surprising states, clearer empty states)
* Performance improvements with a before/after measurement
* Documentation fixes (typos, broken examples, README clarity)
* Tests that cover something previously untested

Things that will sit in review longer or get closed:

* Big architectural rewrites without prior discussion
* Adding a new dependency for something the standard library or an existing dep can do
* New features that haven't been talked through in an issue first
* Comment-heavy PRs where the comments explain what the code already says
* AI-generated PRs that don't fix a problem someone has actually hit

If you want to ship something substantial, open an issue first describing the problem and the rough shape of your solution. I'd rather steer the design early than turn down a finished PR.

## Filing a bug

Tell me:

1. What you did (the steps, in order)
2. What you expected
3. What actually happened
4. Browser / OS / docker version if it looks environmental
5. Anything useful from `docker compose logs research-api` or the browser console

Screenshots help if it's a visual issue. You don't need to paste the whole repo into the issue.

## Security

If you find something that looks like a real security issue, email me at kimaswaemma36@gmail.com instead of opening a public issue. I'll get back to you within a few days.

## License

The repo is MIT. By sending a PR you're agreeing your contribution is MIT too.
