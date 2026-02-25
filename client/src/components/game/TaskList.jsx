import TaskCard from './TaskCard';

export default function TaskList({ tasks, taskTypeCounts }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-xs uppercase tracking-[0.2em] text-cyan-200 font-black mb-3">Suas tasks</h2>
      <div className="space-y-2">
        {tasks.map((task) => {
          const suffix = taskTypeCounts[task.taskType] > 1 ? ` #${task.repeatIndex}` : '';
          return (
            <TaskCard
              key={task.instanceId}
              task={task}
              suffix={suffix}
              showFakeLabel={!task.hideFakeLabel}
            />
          );
        })}
      </div>
    </section>
  );
}
