import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRow({ id, label, index }: { id: string; label: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-white rounded-lg border border-stone-200 px-3 py-2.5 shadow-sm"
    >
      <span className="text-stone-400 w-7 text-sm font-semibold tabular-nums">{index + 1}</span>
      <span className="flex-1 text-stone-800 text-sm font-medium">{label}</span>
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none p-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50"
        aria-label={`Drag to reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
    </li>
  );
}

interface DormOption {
  id: string;
  label: string;
}

export default function DormRankList({
  dorms,
  order,
  onOrderChange,
}: {
  dorms: DormOption[];
  order: string[];
  onOrderChange: (next: string[]) => void;
}) {
  const labelById = Object.fromEntries(dorms.map((d) => [d.id, d.label]));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onOrderChange(arrayMove(order, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {order.map((id, i) => (
            <SortableRow key={id} id={id} label={labelById[id] ?? id} index={i} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
