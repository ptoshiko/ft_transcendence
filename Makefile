.PHONY: migrate
migrate:
	$(info $(M) running DB migrations...)
	docker-compose exec backend python manage.py makemigrations main
	docker-compose exec backend python manage.py migrate