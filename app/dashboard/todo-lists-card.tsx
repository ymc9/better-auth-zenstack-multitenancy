'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    useCreateTodo,
    useCreateTodoList,
    useDeleteTodo,
    useDeleteTodoList,
    useFindManyTodo,
    useFindManyTodoList,
    useUpdateTodo,
} from '@/hooks/model';
import { useActiveOrganization } from '@/lib/auth-client';
import { Todo, TodoList } from '@prisma/client';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function TodoListsCard() {
    const { data: activeOrg } = useActiveOrganization();

    const { data: todoLists, refetch } = useFindManyTodoList({
        orderBy: { createdAt: 'desc' },
    });

    const { mutateAsync: del, isPending: isDeleting } = useDeleteTodoList();

    // current editing TodoList
    const [currentOpenList, setCurrentOpenList] = useState<TodoList>();

    // refetch todo lists when active org changes
    useEffect(() => void refetch(), [activeOrg]);

    async function onDelete(id: string) {
        await del({ where: { id } });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Todo List</CardTitle>
                <div className="w-full flex justify-end">
                    <CreateTodoListDialog />
                </div>
            </CardHeader>
            <CardContent className="grid gap-8 grid-cols-1">
                <div className="flex flex-col gap-2">
                    {todoLists?.map((list) => (
                        <div
                            key={list.id}
                            className="flex justify-between items-center"
                        >
                            <div className="flex items-center gap-2">
                                <div>
                                    <p
                                        className="text-sm cursor-pointer"
                                        onClick={() => setCurrentOpenList(list)}
                                    >
                                        {list.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {list.createdAt.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={isDeleting}
                                onClick={() => onDelete(list.id)}
                            >
                                Delete
                            </Button>
                        </div>
                    ))}
                </div>
                <TodoListDialog
                    list={currentOpenList}
                    onClose={() => setCurrentOpenList(undefined)}
                />
            </CardContent>
        </Card>
    );
}

function CreateTodoListDialog() {
    const [name, setName] = useState('');
    const [open, setOpen] = useState(false);
    const { mutateAsync: create, isPending } = useCreateTodoList();

    useEffect(() => {
        if (open) {
            setName('');
        }
    }, [open]);

    async function onCreate() {
        await create({ data: { name: name } });
        toast.success('Todo list created successfully');
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="default">
                    <PlusIcon />
                    <p>New Todo List</p>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] w-11/12">
                <DialogHeader>
                    <DialogTitle>New Todo List</DialogTitle>
                    <DialogDescription>
                        Create a new todo list.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label>List Name</Label>
                        <Input
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button disabled={isPending} onClick={onCreate}>
                        {isPending ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            'Create'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TodoListDialog({
    list,
    onClose,
}: {
    list?: TodoList;
    onClose: () => void;
}) {
    const [title, setTitle] = useState('');

    const { data: todos } = useFindManyTodo(
        {
            where: { listId: list?.id },
            orderBy: { createdAt: 'desc' },
        },
        { enabled: !!list }
    );

    const { mutateAsync: create, isPending } = useCreateTodo();

    function onOpenChange(open: boolean) {
        if (!open) {
            onClose();
        }
    }

    async function onCreate() {
        if (!title.trim()) {
            return;
        }

        await create({
            data: { title, listId: list!.id },
        });
        setTitle('');
    }

    return (
        <Dialog open={!!list} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] w-11/12">
                <DialogHeader>
                    <DialogTitle>{list?.name}</DialogTitle>
                    <div className="pt-4">
                        <Input
                            placeholder="Enter title and press enter to create"
                            value={title}
                            disabled={isPending}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyUp={(e) => {
                                if (e.key === 'Enter') {
                                    onCreate();
                                }
                            }}
                        />
                        <div className="mt-4">
                            {todos?.map((todo) => (
                                <TodoItem key={todo.id} todo={todo} />
                            ))}
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TodoItem({ todo }: { todo: Todo }) {
    const { mutateAsync: update, isPending: isUpdating } = useUpdateTodo();
    const { mutateAsync: del, isPending: isDeleting } = useDeleteTodo();
    const [isDone, setIsDone] = useState(todo.done);

    async function onToggleDone() {
        await update({ where: { id: todo.id }, data: { done: !todo.done } });
        setIsDone(!todo.done);
    }

    async function onDelete() {
        await del({ where: { id: todo.id } });
    }

    return (
        <div className="flex justify-between">
            <p className={todo.done ? 'line-through' : ''}>{todo.title}</p>
            <div className="flex gap-1 items-center">
                <Checkbox
                    disabled={isUpdating || isDeleting}
                    onCheckedChange={onToggleDone}
                    checked={isDone}
                />
                <Button
                    size="icon"
                    variant="ghost"
                    disabled={isUpdating || isDeleting}
                >
                    <TrashIcon className="cursor-pointer" onClick={onDelete} />
                </Button>
            </div>
        </div>
    );
}
