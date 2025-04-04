import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Task {
    id: string;
    title: string;
    description: string;
    assignee: {
        _id: string;
        nom: string;
        prenom: string;
    };
    creator: {
        _id: string;
        nom: string;
        prenom: string;
    };
    startDate: string;
    endDate: string;
    status: 'todo' | 'inProgress' | 'done';
    progress: number;
    tags: string[];
    actionId?: string;
}

interface KanbanBoardProps {
    tasks: {
        todo: Task[];
        inProgress: Task[];
        done: Task[];
    };
    onTaskMove: (source: { droppableId: string; index: number }, destination: { droppableId: string; index: number }) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskMove }) => {
    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const source = {
            droppableId: result.source.droppableId,
            index: result.source.index
        };

        const destination = {
            droppableId: result.destination.droppableId,
            index: result.destination.index
        };

        onTaskMove(source, destination);
    };

    const renderTaskCard = (task: Task) => {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                    {task.actionId && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Action
                        </span>
                    )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{task.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                        <span className="mr-2">
                            {format(new Date(task.endDate), 'dd MMM yyyy', { locale: fr })}
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {task.assignee.prenom} {task.assignee.nom}
                        </span>
                    </div>
                    <div className="flex items-center">
                        {task.tags.map((tag, index) => (
                            <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded ml-1">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-3 gap-4">
                {/* To Do Column */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        To Do ({tasks.todo.length})
                    </h3>
                    <Droppable droppableId="todo">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {tasks.todo.map((task, index) => (
                                    <Draggable
                                        key={task.id}
                                        draggableId={task.id}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                {renderTaskCard(task)}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>

                {/* In Progress Column */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        In Progress ({tasks.inProgress.length})
                    </h3>
                    <Droppable droppableId="inProgress">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {tasks.inProgress.map((task, index) => (
                                    <Draggable
                                        key={task.id}
                                        draggableId={task.id}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                {renderTaskCard(task)}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>

                {/* Done Column */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Done ({tasks.done.length})
                    </h3>
                    <Droppable droppableId="done">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {tasks.done.map((task, index) => (
                                    <Draggable
                                        key={task.id}
                                        draggableId={task.id}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                {renderTaskCard(task)}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard; 