from apps.achats.models.Workflow_history import WorkflowHistory


def log_workflow(
    demande,
    user,
    action,
    old_status="",
    new_status="",
    commentaire="",
):
    WorkflowHistory.objects.create(
        demande=demande,
        user=user,
        action=action,
        old_status=old_status or "",
        new_status=new_status or "",
        commentaire=commentaire or "",
    )
