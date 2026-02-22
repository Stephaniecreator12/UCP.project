@echo off
echo --- Installation Frontend ---
npm install
echo --- Installation Backend ---
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
echo --- Termine ! ---
pause