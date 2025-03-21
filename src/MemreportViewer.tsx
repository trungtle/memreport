import  {useState} from 'react';
import FileUpload from './FileUpload'
import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import 'react-data-grid/lib/styles.css';
import './Menu.css'
import "@szhsin/react-menu/dist/core.css";
import '@szhsin/react-menu/dist/transitions/zoom.css';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import TextureTab from './tabs/TextureTab';
import FromMemreportTab from './tabs/FromMemreportTab';

const Memreport: React.FC = () => {
    const [fileName, setFileName] = useState<string>('');
    const [fromMemreportLinesArray, setFromMemreportLinesArray] = useState<string[]>([]);
    const [textureLinesArray, setTextureLinesArray] = useState<string[]>([]);
    const [textureGroupLinesArray, setTextureGroupLinesArray] = useState<string[]>([]);

    const parseFromMemreport = (lines: string[]) => {
        const beginMarker = 'MemReport: Begin command "Mem FromReport"';
        const endMarker = 'MemReport: End command "Mem FromReport"';
        
        let capturing = false;
        let filteredLines = lines.filter(line => {
            if (!line) return false;            
            if (line.trim() === '') return false;
            if (line.toLowerCase().startsWith(beginMarker.toLowerCase())) {
                capturing = true;
                return false;
            }
            if (line.toLowerCase().startsWith(endMarker.toLowerCase())) {
                capturing = false;
                return false;
            }
            if (capturing) {
                return true;
            }          
            return false;
        });

        setFromMemreportLinesArray(filteredLines);
    }

    const parseTextureLines = (lines: string[]) => {
        const beginMarker = 'MemReport: Begin command "ListTextures';
        const endMarker = 'MemReport: End command "ListTextures';
        
        let capturing = false;
        let skipCount = 0;
        const filteredLines = lines.filter(line => {
            if (!line) return false;            
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
        const NUM_LISTTEXTURES_COLUMNS = 12;
        const checkTextureGroupLinesCondition = (line: string) => line.startsWith('Total') && (line.split(',').length < NUM_LISTTEXTURES_COLUMNS);

        const [textureGroupLines, textureLines] = filteredLines.reduce<[string[], string[]]>(([total, texture], line) => {
            if (checkTextureGroupLinesCondition(line)) {
                total.push(line);
            } else {
                texture.push(line);
            }
            return [total, texture];
        }, [[], []]);

        const uniqueTextureLines = Array.from(new Set(textureLines));

        setTextureGroupLinesArray(textureGroupLines);
        setTextureLinesArray(uniqueTextureLines);
    }

    const handleSetLinesArray = (lines: string[]) => {
        parseFromMemreport(lines);
        parseTextureLines(lines);
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
            </Menu>
            <div className='file-name'>{fileName}</div>
        </div>

        <div className="memreport-table">
            <Tabs>
                <TabList>
                <Tab>Summary</Tab>
                <Tab>Textures</Tab>
                </TabList>

                <TabPanel>
                    <FromMemreportTab fromMemreportLines={fromMemreportLinesArray} />
                </TabPanel>

                <TabPanel>
                    <TextureTab textureGroupLines={textureGroupLinesArray} textureLines={textureLinesArray} />
                </TabPanel>

            </Tabs>
        </div>
    </div>

}

export default Memreport;