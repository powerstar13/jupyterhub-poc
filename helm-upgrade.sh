helm upgrade --cleanup-on-fail `
  --install jupyterhub jupyterhub/jupyterhub `
  --namespace poc `
  --create-namespace `
  --version=4.1.0 `
  --values config.yml
