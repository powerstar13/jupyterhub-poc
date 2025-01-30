# 1. Zero to JupyterHub

## 1.1 Helm 차트 사용

```shell
$ helm repo add jupyterhub https://hub.jupyter.org/helm-chart/
$ helm repo update
```

## 1.2 JupyterHub 설치

```shell
$ helm upgrade --cleanup-on-fail \
  --install <helm-release-name> jupyterhub/jupyterhub \
  --namespace <k8s-namespace> \
  --create-namespace \
  --version=<chart-version> \
  --values config.yml
```
