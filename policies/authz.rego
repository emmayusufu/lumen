package authz

default allow = false

allow if input.role == "owner"
allow if {
	input.role == "editor"
	input.action in {"read", "write"}
}
allow if {
	input.role == "viewer"
	input.action == "read"
}

allow if {
	input.workspace_role == "admin"
	input.action in {"invite", "remove_member", "change_role", "rename_workspace", "delete_workspace", "read_workspace"}
}
allow if {
	input.workspace_role == "editor"
	input.action == "read_workspace"
}
allow if {
	input.workspace_role == "viewer"
	input.action == "read_workspace"
}
