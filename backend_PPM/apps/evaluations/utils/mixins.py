import json

from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from apps.users.services.external_directory import get_external_identity_from_request


class ExternalActorMixin:
    def get_external_actor(self):
        external_id, label = get_external_identity_from_request(self.request)
        if not external_id:
            raise PermissionDenied(
                "Identité RH introuvable pour ce jeton : action refusée."
            )
        return external_id, label


class AuditedModelMixin(ExternalActorMixin):

    actor_id_field = None
    actor_label_field = None
    set_actor_on_update = True
    extra_timestamp_field = None

    def _actor_kwargs(self):
        if not self.actor_id_field:
            return {}
        external_id, label = self.get_external_actor()
        kwargs = {self.actor_id_field: external_id}
        if self.actor_label_field:
            kwargs[self.actor_label_field] = label
        if self.extra_timestamp_field:
            kwargs[self.extra_timestamp_field] = timezone.now()
        return kwargs

    def _snapshot(self, instance):
        """Représentation JSON-safe de l'instance pour old_value/new_value."""
        data = self.get_serializer(instance).data
        return json.loads(json.dumps(data, default=str))

    def perform_create(self, serializer):
        instance = serializer.save(**self._actor_kwargs())
        external_id, label = self.get_external_actor()
        instance.enregistrer_audit(
            action="CREATE",
            old_value=None,
            new_value=self._snapshot(instance),
            external_user_id=external_id,
            external_user_label=label,
        )

    def perform_update(self, serializer):
        old_value = self._snapshot(serializer.instance)
        kwargs = self._actor_kwargs() if self.set_actor_on_update else {}
        instance = serializer.save(**kwargs)
        external_id, label = self.get_external_actor()
        instance.enregistrer_audit(
            action="UPDATE",
            old_value=old_value,
            new_value=self._snapshot(instance),
            external_user_id=external_id,
            external_user_label=label,
        )

    def perform_destroy(self, instance):
        external_id, label = self.get_external_actor()
        old_value = self._snapshot(instance)
        instance.enregistrer_audit(
            action="DELETE",
            old_value=old_value,
            new_value=None,
            external_user_id=external_id,
            external_user_label=label,
        )
        instance.delete()