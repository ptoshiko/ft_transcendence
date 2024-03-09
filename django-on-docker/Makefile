M                := $(shell printf "\033[34;1m>>\033[0m")

.PHONY: migrate
migrate:
	$(info $(M) running DB migrations...)
	docker-compose exec web python manage.py makemigrations main
	docker-compose exec web python manage.py migrate