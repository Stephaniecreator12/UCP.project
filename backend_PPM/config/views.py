from django.contrib.auth.views import LoginView


class AdminLoginView(LoginView):
    template_name = "admin/login.html"

    def get_success_url(self):
        return "/admin/ppm-dashboard/"
