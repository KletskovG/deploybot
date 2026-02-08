dev:
	npm run dev

build:
	npm run build

start:
	npm run start

test:
	npm run test

docker-env:
	cp .config/env/.env.production deployment/docker/deploybot.env

# Production
docker-up:
	docker compose -f deployment/docker/docker-compose.yml up -d

docker-down:
	docker compose -f deployment/docker/docker-compose.yml down

docker-logs:
	docker compose -f deployment/docker/docker-compose.yml logs -f

docker-restart:
	docker compose -f deployment/docker/docker-compose.yml restart

docker-ps:
	docker compose -f deployment/docker/docker-compose.yml ps

docker-pull:
	docker compose -f deployment/docker/docker-compose.yml pull

docker-deploy: docker-pull docker-up

nginx-deploy:
	cp ./.config/nginx/deploybot.conf /etc/nginx/sites-available/deploybot.conf
	sudo systemctl restart nginx

# Development
docker-build-dev:
	docker build -t localhot/deploybot:latest -f deployment/docker/Dockerfile.dev .

docker-up-dev:
	docker compose -f deployment/docker/docker-compose-dev.yml up -d

docker-down-dev:
	docker compose -f deployment/docker/docker-compose-dev.yml down

docker-logs-dev:
	docker compose -f deployment/docker/docker-compose-dev.yml logs -f

docker-ps-dev:
	docker compose -f deployment/docker/docker-compose-dev.yml ps

docker-deploy-dev: docker-build-dev docker-up-dev

docker-clean:
	docker image prune

.DEFAULT_GOAL := dev