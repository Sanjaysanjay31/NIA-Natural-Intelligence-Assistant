from typing import Dict, List, Any, Optional
from app.schemas.impact import ImpactItem
from app.schemas.enums import ImpactSeverity


class GraphNode:
    def __init__(self, node_id: str, node_type: str, label: str, properties: Optional[Dict[str, Any]] = None):
        self.node_id = node_id
        self.node_type = node_type  # event, location, reminder, alarm, commitment, person, evidence, action
        self.label = label
        self.properties = properties or {}


class RealityGraph:
    """
    Lightweight in-memory domain graph linking entities, locations, reminders,
    alarms, commitments, evidence, and actions for impact traversal.
    """

    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        # Adjacency list: node_id -> list of (target_node_id, relationship_type)
        self.edges: Dict[str, List[tuple[str, str]]] = {}
        self._seed_default_graph()

    def add_node(self, node_id: str, node_type: str, label: str, properties: Optional[Dict[str, Any]] = None) -> GraphNode:
        node = GraphNode(node_id, node_type, label, properties)
        self.nodes[node_id] = node
        if node_id not in self.edges:
            self.edges[node_id] = []
        return node

    def add_edge(self, source_id: str, target_id: str, relationship: str):
        if source_id not in self.edges:
            self.edges[source_id] = []
        self.edges[source_id].append((target_id, relationship))

    def _seed_default_graph(self):
        """Seed default hackathon scenario graph."""
        # Event: Final Presentation
        self.add_node("evt-final-presentation", "event", "Final Presentation", {
            "time": "09:00",
            "location": "Room 204",
            "date": "2026-09-19"
        })

        # Location: Room 204
        self.add_node("loc-room-204", "location", "Room 204", {"floor": 2, "building": "Engineering"})
        self.add_edge("evt-final-presentation", "loc-room-204", "LOCATED_AT")

        # Reminder: Projector Equipment Check
        self.add_node("rem-projector-check", "reminder", "Check Room 204 projector equipment", {
            "scheduledTime": "08:30",
            "targetLocation": "Room 204"
        })
        self.add_edge("evt-final-presentation", "rem-projector-check", "TRIGGERS_REMINDER")

        # Alarm: Presentation Wake-Up
        self.add_node("alm-presentation-wakeup", "alarm", "Wake-up for Final Presentation", {
            "alarmTime": "07:45",
            "bufferMinutes": 75
        })
        self.add_edge("evt-final-presentation", "alm-presentation-wakeup", "SCHEDULED_ALARM")

        # Commitment: Meet Prof. Sharma outside room
        self.add_node("cmt-prof-sharma", "commitment", "Meet Prof. Sharma outside presentation room", {
            "counterparty": "Prof. Sharma",
            "deadline": "08:45",
            "location": "Room 204"
        })
        self.add_edge("evt-final-presentation", "cmt-prof-sharma", "LINKED_COMMITMENT")

    def find_event_by_name(self, name: str) -> Optional[GraphNode]:
        search = name.lower().strip()
        for node in self.nodes.values():
            if node.node_type == "event" and search in node.label.lower():
                return node
        return None

    def query_impacted_entities(self, event_id: str, new_location: Optional[str] = None) -> List[ImpactItem]:
        """
        Traverse graph outgoing edges from the subject event to identify
        all downstream reminders, alarms, and commitments impacted by the reality drift.
        """
        impacts: List[ImpactItem] = []
        if event_id not in self.edges:
            return impacts

        for target_id, relation in self.edges.get(event_id, []):
            target_node = self.nodes.get(target_id)
            if not target_node:
                continue

            if target_node.node_type == "reminder":
                impacts.append(
                    ImpactItem(
                        impact_id=f"imp-{target_node.node_id}",
                        target_type="reminder",
                        target_id=target_node.node_id,
                        description=f"Reminder '{target_node.label}' references outdated location.",
                        severity=ImpactSeverity.HIGH,
                        suggested_remediation=f"Update target destination to {new_location or 'new location'}"
                    )
                )
            elif target_node.node_type == "alarm":
                impacts.append(
                    ImpactItem(
                        impact_id=f"imp-{target_node.node_id}",
                        target_type="alarm",
                        target_id=target_node.node_id,
                        description="Travel buffer may need adjustment for new room floor.",
                        severity=ImpactSeverity.MEDIUM,
                        suggested_remediation="Advance alarm by 5 minutes for additional walking buffer"
                    )
                )
            elif target_node.node_type == "commitment":
                impacts.append(
                    ImpactItem(
                        impact_id=f"imp-{target_node.node_id}",
                        target_type="commitment",
                        target_id=target_node.node_id,
                        description=f"Commitment with {target_node.properties.get('counterparty', 'teammate')} outside old room.",
                        severity=ImpactSeverity.HIGH,
                        suggested_remediation=f"Relocate meeting spot to outside {new_location or 'new room'}"
                    )
                )

        return impacts


reality_graph = RealityGraph()
