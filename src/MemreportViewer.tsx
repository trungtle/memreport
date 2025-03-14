import  {createContext, useContext, useMemo, useState} from 'react';

import { Column, DataGrid, RenderHeaderCellProps, SortColumn } from 'react-data-grid';
import FileUpload from './FileUpload'
import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import 'react-data-grid/lib/styles.css';
import './Menu.css'
import "@szhsin/react-menu/dist/core.css";
import '@szhsin/react-menu/dist/transitions/zoom.css';

const FilterContext = createContext<Filter | undefined>(undefined);

function inputStopPropagation(event: React.KeyboardEvent<HTMLInputElement>) {
    if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.stopPropagation();
    }
}

function selectStopPropagation(event: React.KeyboardEvent<HTMLSelectElement>) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.stopPropagation();
    }
}

interface SummaryRow {
    id: string;
    textureCount: number;
}

interface GroupRow {
    id: string;
    inMemSize: number;
    onDiskSize: number;
}


interface Row {
    name: string;
    currentDim: string;
    currentSize: number; // KB
    cookedDim: string;
    cookedSize: number; // KB
    format: string;
    lodGroup: string;
    streaming: boolean;
    vt: boolean;
    usageCount: number;
    numMips: number;
    uncompressed: boolean;
}

interface Filter extends Omit<Row, 'cookedDim' | 'cookedSize' | 'currentDim' | 'currentSize' | 'usageCount' | 'numMips' | 'vt' | 'streaming'> {
    streaming: string;
    vt: string;
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

const Memreport: React.FC = () => {
    const [fileName, setFileName] = useState<string>('');
    const [linesArray, setLinesArray] = useState<string[]>([]);
    const [totalLinesArray, setTotalLinesArray] = useState<string[]>([]);
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
    const [sortGroupColumns, setSortGroupColumns] = useState<readonly SortColumn[]>([]);
    const NUM_LISTTEXTURES_COLUMNS = 12;
    const [filters, setFilters] = useState(
        (): Filter => ({
            name: '',
            vt: 'All',
            streaming: 'All',
            uncompressed: true,
            format: '',
            lodGroup: '',
            enabled: true
        })
      );

    const handleSetLinesArray = (lines: string[]) => {
        const beginMarker = 'MemReport: Begin command "ListTextures';
        const endMarker = 'MemReport: End command "ListTextures';
        let capturing = false;
        let skipCount = 0;
        const filteredLines = lines.filter(line => {
          if (line.trim() === '') return false;
          if (line.toLowerCase().startsWith(beginMarker.toLowerCase())) {
            capturing = true;
            skipCount = 0;
            return false;
          }
          if (line.toLowerCase().startsWith(endMarker.toLowerCase())) {
            capturing = false;
            return false;
          }
          if (capturing) {
            if (skipCount < 2) {
              skipCount++;
              return false;
            }
            return true;
          }          
          return false;
        });

        // Test on lines that provide total texture counts and sizes
        const testCondition = (line: string) => line.startsWith('Total') && (line.split(',').length < NUM_LISTTEXTURES_COLUMNS);

        const [totalLines, textureLines] = filteredLines.reduce<[string[], string[]]>(([total, texture], line) => {
            if (testCondition(line)) {
                total.push(line);
            } else {
                texture.push(line);
            }
            return [total, texture];
        }, [[], []]);

        setTotalLinesArray(totalLines);
        setLinesArray(textureLines);
    }

    const textureColumns = useMemo(() : readonly Column<Row, SummaryRow>[] => {
        return [
        { key: 'name', name: 'Name',
            sortable: false,
            width: 'minmax(600px, max-content)',
            renderSummaryCell({row}: { row: SummaryRow }) {
                return `Count: ${row.textureCount} textures`;
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
        { key: 'currentDim', name: 'InMem Dim', sortable: false,
        },
        { key: 'currentSize', name: 'InMem Size',
            renderCell({ row }) {
                return <span>{(row.currentSize / 1000.0).toFixed(2)} MB</span>;
            }
        }, 
        { key: 'cookedDim', name: 'Cooked Dim', sortable: false,
        },
        { key: 'cookedSize', name: 'Cooked Size',
            renderCell({ row }) {
                return <span>{(row.cookedSize / 1000.0).toFixed(2)} MB</span>;
            },
        },
        { key: 'format', name: 'Format',
            sortable: false,
            renderHeaderCell: (p) => (
                <FilterRenderer<Row, SummaryRow> {...p}>
                {({ filters, ...rest }) => (
                    <input
                    {...rest}
                    value={filters.format}
                    onChange={(e) =>
                        setFilters({
                        ...filters,
                        format: e.target.value
                        })
                    }
                    onKeyDown={inputStopPropagation}
                    />
                )}
                </FilterRenderer>
            )
        }, 
        { key: 'lodGroup', name: 'LODGroup',
            sortable: false,
            renderHeaderCell: (p) => (
                <FilterRenderer<Row, SummaryRow> {...p}>
                {({ filters, ...rest }) => (
                    <input
                    {...rest}
                    value={filters.lodGroup}
                    onChange={(e) =>
                        setFilters({
                        ...filters,
                        lodGroup: e.target.value
                        })
                    }
                    onKeyDown={inputStopPropagation}
                    />
                )}
                </FilterRenderer>
            )
        }, 
        { key: 'streaming', name: 'Streaming',
            renderHeaderCell: (p) => (
                <FilterRenderer<Row, SummaryRow> {...p}>
                  {({ filters, ...rest }) => (
                    <select
                      {...rest}
                      value={filters.streaming}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          streaming: e.target.value
                        })
                      }
                    onKeyDown={selectStopPropagation}>
                    <option value="All">All</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                    </select>
                )}
                </FilterRenderer>
            ),
            renderCell({ row}: { row: Row}) {
                return (
                <div>{row.streaming ? 'YES' : 'NO'}</div>
                );
            },
        }, 
        { key: 'vt', name: 'VT',
            renderHeaderCell: (p) => (
              <FilterRenderer<Row, SummaryRow> {...p}>
                {({ filters, ...rest }) => (
                  <select
                    {...rest}
                    value={filters.vt}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        vt: e.target.value
                      })
                    }
                    onKeyDown={selectStopPropagation}
                  >
                    <option value="All">All</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                )}
              </FilterRenderer>
            ),
            renderCell({ row}: { row: Row}) {
                return (
                  <div>{row.vt ? 'YES' : 'NO'}</div>
                );
              },
        }, 
        { key: 'usageCount', name: 'Usage Count'},
        { key: 'numMips', name: 'NumMips'},
        { key: 'uncompressed', name: 'Uncompressed',
            renderCell({ row}: { row: Row}) {
                return (
                  <div>{row.uncompressed ? 'YES' : 'NO'}</div>
                );
              },
        },
        ]}, []);
    

    const rows : readonly Row[] = linesArray.map((line) => {

        // Parse this:
        // Cooked/OnDisk: Width x Height (Size in KB, Authored Bias), Current/InMem: Width x Height (Size in KB), Format, LODGroup, Name, Streaming, UnknownRef, VT, Usage Count, NumMips, Uncompressed
        // 2048x2048 (32768 KB, ?), 2048x2048 (32768 KB), PF_FloatRGBA, TEXTUREGROUP_World, /Engine/EngineMaterials/DefaultBloomKernel.DefaultBloomKernel, NO, NO, NO, 0, 1, YES

        let tokens = line.split(',');

        // Parse width and height from the first token
        const matchDimensions = (tokens: string): [number, number] => {
            const match = tokens.match(/(\d+)x(\d+)/);
            if (match) {
                return [parseInt(match[1], 10), parseInt(match[2], 10)];
            }
            return [0, 0];
        }

        let [cookedWidth, cookedHeight] = matchDimensions(tokens[0]);
        let cookedSize = parseInt(tokens[0].match(/\((\d+) KB/)?.[1] || '0', 10);

        let [currentWidth, currentHeight] = matchDimensions(tokens[2]);
        let currentSize = parseInt(tokens[2].match(/\((\d+) KB\)/)?.[1] || '0', 10);

        return { 
            name: tokens[5].split('.')[0] || '',
            cookedDim: cookedWidth + 'x' + cookedHeight,
            cookedSize: cookedSize,
            currentDim: currentWidth + 'x' + currentHeight,
            currentSize: currentSize,
            format: tokens[3].split('_').pop() || '',
            lodGroup: tokens[4].split('_').pop() || '',
            streaming: tokens[6].trim() === 'YES' ? true : false,
            vt: tokens[8].trim() === 'YES' ? true : false,
            usageCount: parseInt(tokens[9], 10),
            numMips: parseInt(tokens[10], 10),
            uncompressed: tokens[11].trim() === 'YES' ? true : false
        };
    });

    type RowComparator = (a: Row, b: Row) => number;

    function getTextureComparator(sortColumn: string): RowComparator {
        switch (sortColumn) {
            case 'name':
            case 'lodGroup':
            case 'format':
                return (a, b) => {
                    const aValue = a[sortColumn] || '';
                    const bValue = b[sortColumn] || '';
                    return aValue.localeCompare(bValue);
                };
            case 'streaming':
            case 'vt':
            case 'uncompressed':
                return (a, b) => { return a[sortColumn] === b[sortColumn] ? 0 : a[sortColumn] ? 1 : -1; };
            case 'cookedDim':
            case 'currentDim':
                return (a, b) => {
                    const aWidthHeight = a[sortColumn].split('x').map((x) => parseInt(x, 10));
                    const bWidthHeight = b[sortColumn].split('x').map((x) => parseInt(x, 10));
                    return aWidthHeight[0] - bWidthHeight[0] || aWidthHeight[1] - bWidthHeight[1];
                };
            case 'usageCount':
            case 'numMips':
            case 'cookedSize':
            case 'currentSize':
                return (a, b) => a[sortColumn] - b[sortColumn];
            default:
                throw new Error(`unsupported sortColumn: "${sortColumn}"`);
        }
    }

    const sortedRows = useMemo((): readonly Row[] => {
        if (sortColumns.length === 0) {
            setSortColumns([{ columnKey: 'currentSize', direction: 'DESC' }]);
        }

        return [...rows].sort((a, b) => {
            for (const sort of sortColumns) {
                const comparator = getTextureComparator(sort.columnKey);
                const compResult = comparator(a, b);
                if (compResult !== 0) return sort.direction === 'ASC' ? compResult : -compResult;
            }
            return 0;
        });
    }, [rows, sortColumns]);

    const filteredRows = useMemo(() => {
        return sortedRows.filter((r) => {
        return (
            (filters.name ? r.name.includes(filters.name) : true) &&
            (filters.format ? r.format.includes(filters.format) : true) &&
            (filters.lodGroup ? r.lodGroup.includes(filters.lodGroup) : true) &&
            (filters.streaming !== 'All' ? r.streaming ? filters.streaming === 'YES' : filters.streaming === 'NO': true) &&
            (filters.vt !== 'All' ? r.vt ? filters.vt === 'YES' : filters.vt === 'NO': true)
        );
        });
    }, [sortedRows, filters]);


    const groupColumns = useMemo(() : readonly Column<GroupRow>[] => {
        return [
            {
                key: 'id', name: 'Texture Group'
            },
            {
                key: 'inMemSize', name: 'InMem Size', 
                renderCell({ row }) {
                    return <span>{row.inMemSize} MB</span>;  
                }
            },
            {
                key: 'onDiskSize', name: 'OnDisk Size',
                renderCell({ row }) {
                    return <span>{row.onDiskSize} MB</span>;  
                }
            }
        
    ]}, []);

    const groupRows : readonly GroupRow[] = totalLinesArray.map((line) => {
        const matchName = line.match(/Total (.*) size:/);
        const matchTotalInMemSize = line.match(/InMem=\s*([\d.]+)\s*MB/);
        const matchTotalOnDiskSize = line.match(/OnDisk=\s*([\d.]+)\s*MB/);

        const name = matchName ? matchName[1] : 'Total Size';
        const inMemSize = matchTotalInMemSize ? parseFloat(matchTotalInMemSize[1]) : 0.0;
        const onDiskSize = matchTotalOnDiskSize ? parseFloat(matchTotalOnDiskSize[1]) : 0.0;

        return {
            id: name,
            inMemSize: inMemSize,
            onDiskSize: onDiskSize
        };
    });

    type GroupRowComparator = (a: GroupRow, b: GroupRow) => number;

    function getTextureGroupComparator(sortColumn: string): GroupRowComparator {
        switch (sortColumn) {
            case 'id':
                return (a, b) => {
                    const aValue = a[sortColumn] || '';
                    const bValue = b[sortColumn] || '';
                    return aValue.localeCompare(bValue);
                }
            case 'inMemSize':
            case 'onDiskSize':
                return (a, b) => a[sortColumn] - b[sortColumn];
            default:
                throw new Error(`unsupported sortColumn: "${sortColumn}"`);
        }
    }

    const sortedGroupRows = useMemo((): readonly GroupRow[] => {
        if (sortGroupColumns.length === 0) {
            return groupRows;
        }

        return [...groupRows].sort((a, b) => {
            for (const sort of sortGroupColumns) {
                const comparator = getTextureGroupComparator(sort.columnKey);
                const compResult = comparator(a, b);
                if (compResult !== 0) return sort.direction === 'ASC' ? compResult : -compResult;
            }
            return 0;
        });
    }, [groupRows, sortGroupColumns]);    

    const summaryRows = useMemo((): readonly SummaryRow[] => {
        return [
            {
                id: 'Total',
                textureCount: rows.length,
            }
        ];
    }, [rows]);

    function clearFilters() {
        setFilters({
            name: '',
            vt: 'All',
            streaming: 'All',
            uncompressed: true,
            format: '',
            lodGroup: '',
            enabled: true
        });
    }
    

    const MenuItemStyle = (props: any) => (
        <MenuItem {...props} className='menu-item' />
    );

    const menuItemClassName = 'memreport-menu';

    return <div className="memreport-container">

        <div className='menu-container'>
            <Menu menuClassName={menuItemClassName} menuButton={<MenuButton>Menu</MenuButton>} transition>
                <MenuItemStyle>            
                    <FileUpload setLinesArray={handleSetLinesArray} setFileName={setFileName}/>
                </MenuItemStyle>
                <MenuItemStyle>
                    <button type="button" onClick={clearFilters}>
                        Clear filters
                    </button>
                </MenuItemStyle>
            </Menu>
            <div className='file-name'>{fileName}</div>
        </div>

        <div className="memreport-table">

            <DataGrid
                className='texture-group-table'
                rows={sortedGroupRows}
                columns={groupColumns}
                sortColumns={sortGroupColumns}
                onSortColumnsChange={setSortGroupColumns}
                defaultColumnOptions={{
                    resizable: true,
                    sortable: true,
                    draggable: true
                }}
            />

            <FilterContext value={filters}>
                <DataGrid
                    topSummaryRows={summaryRows}
                    rows={filteredRows}
                    columns={textureColumns}
                    sortColumns={sortColumns}
                    onSortColumnsChange={setSortColumns}
                    headerRowHeight={70}
                    className='texture-table'
                    defaultColumnOptions={{
                        resizable: true,
                        sortable: true,
                        draggable: true
                    }}/>
            </FilterContext>
        </div>
    </div>

}

export default Memreport;