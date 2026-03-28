from app.graph import build_graph


def test_graph_compiles():
    graph = build_graph()
    assert graph is not None


def test_graph_has_all_nodes():
    graph = build_graph()
    node_names = set(graph.get_graph().nodes.keys())
    expected = {
        "__start__",
        "__end__",
        "supervisor",
        "planner",
        "researcher",
        "coder",
        "writer",
    }
    assert expected.issubset(node_names)
