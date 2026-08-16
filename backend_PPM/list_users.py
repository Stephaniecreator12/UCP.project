from django.contrib.auth import get_user_model
User = get_user_model()
with open('users_list.txt', 'w') as f:
    for u in User.objects.all():
        groups = ', '.join(u.groups.values_list('name', flat=True))
        f.write(f"Username: {u.username} | Email: {u.email} | Groups: {groups}\n")
print("Done writing users_list.txt")
