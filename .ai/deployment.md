# Deployments

`master` is the default and only long-lived branch. Pull requests target master.

| Entry workflow | Trigger | GitHub environment / Firebase target |
| --- | --- | --- |
| `deploy-dev.yml` (Deploy dev) | Every push to master, or manual retry on master | `stage` |
| `deploy-prod.yml` (Deploy production) | Manual on master, with a full commit SHA | `prod` |

Both call `deploy.yml`. It validates that the SHA belongs to master and runs Go
tests (parser and server), parser lint, and a clean frontend build. Production
also requires a successful Deploy dev workflow for that exact SHA. Required web
checks run for every PR, including PRs without frontend changes, so branch
protection does not wait forever on a skipped path-filtered workflow.

Deployment builds matching WASM/runtime files, uploads them to
`<bucket>/releases/<sha>/wasm/`, runs and waits for the environment's Cloud Build
backend deployment, and then publishes Firebase Hosting. The frontend's
`VITE_WASM_BASE_URL` points at `<configured-base>/releases/<sha>/`. Old release
directories are retained so existing tabs and rolled-back frontends keep using
their matching parser. Retain legacy `/wasm/` files for pre-migration clients.

Deployment runs queue separately for dev and prod (`queue: max`, up to 100
pending runs). They do not cancel an in-progress release. GitHub orders the queue
by when runs start waiting; commits pushed together produce one push run for
the final commit. Each component uses the selected SHA; the release is not an
atomic transaction across the three services. A failed run can leave a newer
backend with the previous frontend. Inspect its summary before retrying.

## GitHub configuration

Keep the existing `stage` and `prod` environment secrets:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `GCS_SA_KEY`
- `GCS_WASM_BUCKET`
- `VITE_WASM_BASE_URL` (public bucket base URL, before `releases/`)
- `VITE_DOWNLOAD_SERVER_URL` (the environment's download proxy base URL)
- `VITE_GA_MEASUREMENT_ID` (optional)

Set these environment variables in both environments:

| Variable | Value |
| --- | --- |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/946553580844/locations/global/workloadIdentityPools/github-deployments/providers/csgo-viewer` |
| `GCP_BUILD_SERVICE_ACCOUNT` | `github-cloud-build@csgo-2d-demo-player.iam.gserviceaccount.com` |
| `CLOUD_BUILD_TRIGGER` (stage) | `4824371d-f22c-4db2-847f-53847a7e6159` |
| `CLOUD_BUILD_TRIGGER` (prod) | `22dcda3e-ebf8-4fa3-b58c-d20812fafeae` |

Restrict both GitHub deployment environments to master. Existing `dev` environment
settings are unused; the automatic development workflow uses `stage`.

## Google Cloud configuration

Project: `csgo-2d-demo-player`, project number `946553580844`.

The existing global Cloud Build triggers retain their service names and IDs, but
both push branch patterns must be `^$` (no real branch matches). GitHub Actions
invokes them explicitly with `--sha`. Do not restore an automatic production push
trigger. Both inline build configurations come from the root `cloudbuild.yaml`.
If that file changes, update both triggers' inline configurations as well.

Each trigger supplies `_SERVICE_NAME` (`csgo-2d-demo-player-dev` or
`csgo-2d-demo-player`), `_TRIGGER_ID`, `_DEPLOY_REGION=europe-west1`, and
`_AR_HOSTNAME=europe-west1-docker.pkg.dev`. Builds publish SHA-tagged images to
the existing Artifact Registry `cloud-run-source-deploy` repository and update
the corresponding service without changing its runtime identity, environment
variables, ingress, or scaling limits.

The `github-deployments` identity pool and `csgo-viewer` OIDC provider allow only
repository ID `446407835`, owner ID `1160903`, ref `refs/heads/master`, and reusable
workflow `sparkoo/csgo-2d-demo-viewer/.github/workflows/deploy.yml@refs/heads/master`.
The GitHub workflow can impersonate the `github-cloud-build` service account
without a stored key. Its `githubCloudBuildRunner` custom project role contains
`cloudbuild.builds.create`, `cloudbuild.builds.get`, and `serviceusage.services.use`.
Builds continue using the existing Cloud Build execution service account.

## Releasing and rolling back

1. Find a successful **Deploy dev** run on master and copy its full commit SHA.
2. In GitHub Actions, open **Deploy production**, select master, and supply the SHA.
3. Inspect the run summary for the selected SHA and linked backend Cloud Build.
4. Verify demo loading, parsing, playback, and Faceit downloads on production.

To roll back, run **Deploy production** with an earlier SHA that successfully
deployed through **Deploy dev**. This rebuilds the backend, WASM, and frontend for
that SHA with production configuration. It does not revert master. Commits from
before this deployment workflow existed need a separate recovery procedure;
their absence from Deploy dev history deliberately prevents normal promotion.

## Migration order

1. Prepare one migration PR against master containing the dev merge and workflow changes.
2. Validate workflows and required PR checks before merging.
3. Provision the Cloud Build runner identity and environment variables.
4. Back up existing Cloud Build trigger configurations and disable their push
   matching (`^$`); install `cloudbuild.yaml` as their inline build configuration.
5. Restrict GitHub deployment environments to master, then merge the migration PR.
   Its push deploys dev; it must not deploy production.
6. Verify the first complete dev deployment and that production's revision is unchanged.
7. Set master as GitHub's default branch; retarget open dev PRs and update branch protection.
8. Verify dev is fully contained in master, then delete the remote dev branch.

## Workflow validation

Run actionlint on all workflows. Until actionlint supports GitHub's documented
`concurrency.queue` field, ignore only its `unexpected key "queue" for
"concurrency" section` diagnostic. All other diagnostics must pass. CI performs
the clean builds and tests; local validation should also check that a versioned
`VITE_WASM_BASE_URL` is embedded correctly in `web/dist/worker.js`.
