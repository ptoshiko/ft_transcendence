.PHONY: migrate

.PHONY: all
all: start-app migrate

.PHONY: migrate
migrate:
	$(info $(M) running DB migrations...)
	docker compose exec backend python manage.py makemigrations main
	docker compose exec backend python manage.py migrate

.PHONY: start-app
start-app:
	$(info $(M) starting the application...)
	docker-compose up --build -d

.PHONY: stop-app
stop-app:
	$(info $(M) deleting everything related and stoping the application...)
	docker-compose down -v