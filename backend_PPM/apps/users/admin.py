from django.contrib import admin

from apps.users.models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "user_groups", "created_at", "updated_at")
    list_filter = ("role", "created_at", "updated_at")
    search_fields = ("user__username", "user__first_name", "user__last_name", "user__email")
    ordering = ("user__username",)
    autocomplete_fields = ("user",)

    def user_groups(self, obj):
        return ", ".join(obj.user.groups.values_list("name", flat=True)) or "-"

    user_groups.short_description = "Groupes"
