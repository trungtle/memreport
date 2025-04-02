import { createContext, useContext, useMemo, useState } from 'react';

import "@szhsin/react-menu/dist/core.css";
import '@szhsin/react-menu/dist/transitions/zoom.css';
import { Column, DataGrid, RenderHeaderCellProps, SortColumn } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import 'react-tabs/style/react-tabs.css';

const FilterContext = createContext<Filter | undefined>(undefined);

function inputStopPropagation(event: React.KeyboardEvent<HTMLInputElement>) {
    if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.stopPropagation();
    }
}

interface SummaryRow {
    count: number;
    numKb: number;
    maxKb: number;
    resExcKb: number;
    resExcDedSysKb: number;
    resExcDedVidKb: number;
    resExcDedUnkKb: number;
}

interface Row {
    name: string;
    numKb: number;
    maxKb: number;
    resExcKb: number;
    resExcDedSysKb: number;
    resExcDedVidKb: number;
    resExcDedUnkKb: number;
}

interface Filter extends Row {
    enabled: boolean;
}

function FilterRenderer<R, SR>({
    tabIndex,
    column,
    children
    }: RenderHeaderCellProps<R, SR> & {
    children: (args: { tabIndex: number; filters: Filter }) => React.ReactElement;
    }) {
    const filters = useContext(FilterContext)!;
    return (
        <>
        <div>{column.name}</div>
        {filters.enabled && <div>{children({ tabIndex, filters })}</div>}
        </>
    );
} 

function parseSummaryLine(line: string) {
    const regex = /(\d+)\s+Objects\s+\(Total:\s+([\d.]+[MK])\s+\/\s+Max:\s+([\d.]+[MK])\s+\/\s+Res:\s+([\d.]+[MK])\s+\|\s+ResDedSys:\s+([\d.]+[MK])\s+\/\s+ResDedVid:\s+([\d.]+[MK])\s+\/\s+ResUnknown:\s+([\d.]+[MK])\)/;
    const match = line.match(regex);

    if (!match) {
        return {
            objectCount: 0,
            total: 0,
            max: 0,
            res: 0,
            resDedSys: 0,
            resDedVid: 0,
            resUnknown: 0,
        };
    }

    const parseValue = (value: string) => {
        return parseFloat(value.slice(0, -1));
    };

    return {
        objectCount: parseInt(match[1], 10),
        total: parseValue(match[2]),
        max: parseValue(match[3]),
        res: parseValue(match[4]),
        resDedSys: parseValue(match[5]),
        resDedVid: parseValue(match[6]),
        resUnknown: parseValue(match[7]),
    };
}

interface ObjListTabProps {
    lines: string[];
    totalLine: string;
}

const ObjListTab: React.FC<ObjListTabProps> = ({lines, totalLine}) => {
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
    const [filters, setFilters] = useState(
        (): Filter => ({
            enabled: true,
            name: '',
            numKb: 0,
            maxKb: 0,
            resExcKb: 0,
            resExcDedSysKb: 0,
            resExcDedVidKb: 0,
            resExcDedUnkKb: 0
        })
    );


    const columns = useMemo(() : readonly Column<Row, SummaryRow>[] => {
        return [
        { key: 'name', name: 'Name',
            sortable: false,
            width: 'minmax(600px, max-content)',
            renderSummaryCell({row}: { row: SummaryRow }) {
                return `Count: ${row.count}`;
            },
            renderHeaderCell: (p) => (
                <FilterRenderer<Row, SummaryRow> {...p}>
                {({ filters, ...rest }) => (
                    <input
                    {...rest}
                    value={filters.name}
                    onChange={(e) =>
                        setFilters({
                        ...filters,
                        name: e.target.value
                        })
                    }
                    onKeyDown={inputStopPropagation}
                    />
                )}
                </FilterRenderer>
            )
        },
        { key: 'numKb', name: 'NumKb',
            renderSummaryCell({row}: { row: SummaryRow }) {
                return `Total: ${row.numKb}M`;
            },
        },
        { key: 'maxKb', name: 'MaxKb',
            renderSummaryCell({row}: { row: SummaryRow }) {
                return `Max: ${row.maxKb}M`;
            },
        },
        { key: 'resExcKb', name: 'ResExcKb',
            renderSummaryCell({row}: { row: SummaryRow }) {
                return `Res: ${row.resExcKb}M`;
            },
        },
        { key: 'resExcDedSysKb', name: 'ResExcDedSysKb',
            renderSummaryCell({row}: { row: SummaryRow }) {
                return `ResDedSys: ${row.resExcDedSysKb}M`;
            },
        },
        { key: 'resExcDedVidKb', name: 'ResExcDedVidKb',
            renderSummaryCell({row}: { row: SummaryRow }) {
                return `ResDedVid: ${row.resExcDedVidKb}M`;
            },
        },
        { key: 'resExcDedUnkKb', name: 'ResExcDedUnkKb',
            renderSummaryCell({row}: { row: SummaryRow }) {
                return `ResUnknown: ${row.resExcDedUnkKb}M`;
            },
        },
        ]}, []);
    

    const rows : readonly Row[] = lines.map((line) => {

        // Parse this:
        // Object      NumKB      MaxKB   ResExcKB  ResExcDedSysKB  ResExcDedVidKB     ResExcUnkKB

        let tokens = line.trim().split(/\s+/);

        return { 
            name: tokens[1].split('.')[0] || '',
            numKb: parseFloat(tokens[2]),
            maxKb: parseFloat(tokens[3]),
            resExcKb: parseFloat(tokens[4]),
            resExcDedSysKb: parseFloat(tokens[5]),
            resExcDedVidKb: parseFloat(tokens[6]),
            resExcDedUnkKb: parseFloat(tokens[7])
        };
    });

    type RowComparator = (a: Row, b: Row) => number;

    function getComparator(sortColumn: string): RowComparator {
        switch (sortColumn) {
            case 'name':
                return (a, b) => {
                    const aValue = a[sortColumn] || '';
                    const bValue = b[sortColumn] || '';
                    return aValue.localeCompare(bValue);
                };
            case 'numKb':
            case 'maxKb':
            case 'resExcKb':
            case 'resExcDedSysKb':
            case 'resExcDedVidKb':
            case 'resExcDedUnkKb':
                return (a, b) => a[sortColumn] - b[sortColumn];
            default:
                throw new Error(`unsupported sortColumn: "${sortColumn}"`);
        }
    }

    const sortedRows = useMemo((): readonly Row[] => {
        if (sortColumns.length === 0) {
            setSortColumns([{ columnKey: 'resExcKb', direction: 'DESC' }]);
        }

        return [...rows].sort((a, b) => {
            for (const sort of sortColumns) {
                const comparator = getComparator(sort.columnKey);
                const compResult = comparator(a, b);
                if (compResult !== 0) return sort.direction === 'ASC' ? compResult : -compResult;
            }
            return 0;
        });
    }, [rows, sortColumns]);

    const filteredRows = useMemo(() => {
        return sortedRows.filter((r) => {
        return (
            (filters.name ? r.name.toLowerCase().includes(filters.name.toLowerCase()) : true)
        );
        });
    }, [sortedRows, filters]);

    const summaryRows = useMemo((): readonly SummaryRow[] => {
        let results = parseSummaryLine(totalLine);
        return [
            {
                count: results.objectCount,
                numKb: results.total,
                maxKb: results.max,
                resExcKb: results.res,
                resExcDedSysKb: results.resDedSys,
                resExcDedVidKb: results.resDedVid,
                resExcDedUnkKb: results.resUnknown
            }
        ];
    }, [rows]);

    
    return <>

                <FilterContext value={filters}>
                    <DataGrid
                        topSummaryRows={summaryRows}
                        bottomSummaryRows={summaryRows}
                        rows={filteredRows}
                        columns={columns}
                        sortColumns={sortColumns}
                        onSortColumnsChange={setSortColumns}
                        headerRowHeight={70}
                        className='obj-table'
                        defaultColumnOptions={{
                            resizable: true,
                            sortable: true,
                            draggable: true
                        }}/>
                </FilterContext>
            </>

}

export default ObjListTab;