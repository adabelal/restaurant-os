'use client';

import { useState, useMemo } from 'react';
import {
    Receipt,
    MailOpen,
    Download,
    Info,
    Search,
    ArrowUpDown,
    FileText,
    Calendar,
    User,
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

interface ProcessedMailItem {
    id: string;
    date: Date;
    type: 'Facture' | 'Rapport Popina' | 'Document';
    source: string;
    amount: number;
    status: string;
    fileUrl: string | null;
    description: string;
    fileName?: string | null;
}

interface ProcessedMailsTableProps {
    initialItems: ProcessedMailItem[];
}

export function ProcessedMailsTable({ initialItems }: ProcessedMailsTableProps) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'Facture' | 'Rapport Popina' | 'Document'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof ProcessedMailItem, direction: 'asc' | 'desc' }>({
        key: 'date',
        direction: 'desc'
    });

    const filteredItems = useMemo(() => {
        return initialItems
            .filter(item => {
                const matchesSearch =
                    item.source.toLowerCase().includes(search.toLowerCase()) ||
                    item.description.toLowerCase().includes(search.toLowerCase()) ||
                    (item.fileName?.toLowerCase().includes(search.toLowerCase()) ?? false);

                const matchesType = typeFilter === 'all' || item.type === typeFilter;

                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === bValue) return 0;

                if (sortConfig.direction === 'asc') {
                    return (aValue ?? '') < (bValue ?? '') ? -1 : 1;
                } else {
                    return (aValue ?? '') > (bValue ?? '') ? -1 : 1;
                }
            });
    }, [initialItems, search, typeFilter, sortConfig]);

    const requestSort = (key: keyof ProcessedMailItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Facture':
                return <Receipt className="h-4 w-4" />;
            case 'Rapport Popina':
                return <MailOpen className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Facture':
                return "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400";
            case 'Rapport Popina':
                return "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400";
            default:
                return "bg-slate-50 text-slate-600 dark:bg-slate-950/30 dark:text-slate-400";
        }
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 w-full md:max-w-md items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par émetteur, objet ou nom de fichier..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Tous les types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les types</SelectItem>
                            <SelectItem value="Facture">Factures</SelectItem>
                            <SelectItem value="Rapport Popina">Rapports Popina</SelectItem>
                            <SelectItem value="Document">Autres Documents</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {filteredItems.length} résultat(s)
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
                            <th className="text-left py-3 px-4 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('date')}>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Date
                                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                </div>
                            </th>
                            <th className="text-left py-3 px-4 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('type')}>
                                <div className="flex items-center gap-1">
                                    Type
                                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                </div>
                            </th>
                            <th className="text-left py-3 px-4 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('source')}>
                                <div className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" />
                                    Émetteur
                                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                </div>
                            </th>
                            <th className="text-left py-3 px-4 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('amount')}>
                                <div className="flex items-center gap-1">
                                    Montant
                                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                </div>
                            </th>
                            <th className="text-left py-3 px-4">Statut</th>
                            <th className="text-right py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-muted-foreground italic text-base">
                                    Aucun email correspondant à votre recherche.
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => (
                                <tr key={`${item.type}-${item.id}`} className="hover:bg-muted/30 transition-colors group">
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="font-semibold text-foreground">
                                            {format(item.date, 'dd MMM yyyy', { locale: fr })}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {format(item.date, 'HH:mm')}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-md ${getTypeColor(item.type)}`}>
                                                {getTypeIcon(item.type)}
                                            </div>
                                            <span className="font-medium whitespace-nowrap">{item.type}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="font-bold text-foreground truncate max-w-[180px]" title={item.source}>
                                            {item.source}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground truncate max-w-[250px]" title={item.description}>
                                            {item.description}
                                        </div>
                                        {item.fileName && (
                                            <div className="mt-1 flex items-center gap-1 text-[10px] py-0.5 px-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full w-fit max-w-[250px] truncate">
                                                <FileText className="h-2.5 w-2.5" />
                                                <span className="truncate">{item.fileName}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 font-orbitron text-base">
                                        {item.amount > 0 ? (
                                            <span className="font-bold">
                                                {item.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs font-normal">--</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <Badge
                                            variant={item.status === 'ALERT' ? 'destructive' : 'secondary'}
                                            className={item.status === 'VALIDATED' || item.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : ''}
                                        >
                                            {item.status === 'VALIDATED' || item.status === 'SUCCESS' ? 'Succès' :
                                                item.status === 'ALERT' ? 'Alerte' :
                                                    item.status === 'PROCESSING' ? 'En cours' : item.status}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {item.fileUrl && (
                                                <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 border-blue-100">
                                                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        Ouvrir
                                                    </a>
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
