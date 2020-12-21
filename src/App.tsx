import React, {useEffect, useMemo, useRef, useState} from "react";
import Immutable from 'immutable';
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-solarized_dark";

import "./App.css";
import {
  quicktype, jsonInputForTargetLanguage, TargetLanguage, OptionDefinition, InputData,
} from "quicktype/dist/quicktype-core";
import {
  AppBar,
  Container,
  Toolbar,
  Button,
  Icon,
  Box,
  Popper, Grid, Theme, Divider, Input, Select, MenuItem, ThemeProvider, createMuiTheme, IconButton,
} from "@material-ui/core";
import {VisibilityRounded, VisibilityOffRounded, InfoOutlined, GitHub} from "@material-ui/icons";
import {Options} from "./components/Options";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/default-highlight";
import {useAsyncMemo} from "use-async-memo";
import {theme} from "./theme";

const styles = (theme: Theme) => ({
  toolbar: theme.mixins.toolbar,
});

enum InputSource {
  json = 'JSON',
  multiple = 'Multiple JSON',
  schema = 'JSON Schema',
  typescript = 'Typescript',
  postman = 'Postman v2.1',
}

function App() {
  const appBar = useRef();
  const [showOptions, setShowOptions] = useState(true);
  const [name, setName] = useState('Welcome');
  const [inputType, setInputType] = useState('json');

  const [language, setLanguage] = useState<TargetLanguage>();
  const [options, setOptions] = useState<Immutable.Map<OptionDefinition, any>>();

  const [json, setJson] = useState(`
  {
  "name": "How To Live Forever",
  "artist": {
    "name": "Michael Forrest",
    "founded": 1982,
    "members": [
      "Michael Forrest"
    ]
  },
  "tracks": [
    {
      "name": "Get Connected",
      "duration": 208
    }
  ]
}
`);
  const converted = useAsyncMemo(async () => {
    if (!language) {
      return null;
    }
    try {
      const input = jsonInputForTargetLanguage(language);
      await input.addSource({
        name: name,
        samples: [json],
      });

      const inputData = new InputData();
      inputData.addInput(input);

      const rendererOptions = options?.map((value, key) => ({[key.name]: value}))
        .reduce((acc, pair) => ({...acc, ...pair}), {});

      return quicktype({
        lang: language,
        rendererOptions: rendererOptions,
        inputData: inputData,
      });
    } catch (e) {
      console.warn(e);
      return null;
    }
  }, [json, language, options, name]);

  useEffect(() => console.log(json), [json]);

  return (
    <>
      <AppBar ref={appBar} position="fixed">
        <Toolbar>
          <Box flexGrow={1}/>
          <Button
            color="inherit"
            onClick={(event) => setShowOptions(!showOptions)}
          >
            <Icon>
              {showOptions ? <VisibilityRounded/> : <VisibilityOffRounded/>}
            </Icon>
            <Box pl={1}>Options</Box>
          </Button>
          <IconButton color="inherit" target="_blank" href="https://github.com/quicktype/quicktype/blob/master/FAQ.md">
            <InfoOutlined/>
          </IconButton>
          <IconButton color="inherit" target="_blank" href="https://github.com/rIIh/quicktype-web-app">
            <GitHub/>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth={false} disableGutters style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
        <Toolbar/>
        <Popper
          open={showOptions}
          anchorEl={appBar.current}
          placement="top-end"
          style={{maxHeight: '100vh'}}
          modifiers={{
            offset: {
              enabled: true,
              offset: "-32, 32",
            },
          }}
        >
          <Options onChanged={(language1, options1) => {
            setLanguage(language1);
            setOptions(options1);
          }}/>
        </Popper>
        <Grid container style={{flexGrow: 1}}>
          <Grid item xs={3} style={{overflow: "hidden", display: 'flex', flexDirection: 'column'}}>
            <Box p={1} color="white" bgcolor="#08212a" height="100%"
                 style={{display: "flex", flexDirection: "column", flexGrow: 1, maxHeight: '100%'}}>
              <ThemeProvider theme={createMuiTheme({
                palette: {
                  type: "dark",
                }
              })}>
                <Grid container spacing={1} style={{flex: 'auto 0 0'}}>
                  <Grid item xs>
                    <Input style={{width: '100%'}} color={"primary"} value={name}
                           onChange={event => setName(event.target.value)}/>
                  </Grid>
                  <Grid item xs>
                    <Select style={{width: '100%'}} value={inputType}
                            onChange={event => setInputType(event.target.value as InputSource)}>
                      {Object.entries(InputSource)
                        .map(([key, name]) => <MenuItem key={key} disabled={key != 'json'}
                                                        value={key}>{name}</MenuItem>)}
                    </Select>
                  </Grid>
                </Grid>
                <Box height={10}/>
                <AceEditor
                  mode="json"
                  value={json}
                  theme="solarized_dark"
                  onChange={setJson}
                  editorProps={{$blockScrolling: true}}
                  style={{width: "100%", flexGrow: 1}}
                />
              </ThemeProvider>
            </Box>
          </Grid>
          <Grid item xs style={{overflow: "hidden"}}>
            <SyntaxHighlighter language={language?.name} customStyle={{height: '100%', margin: 0}}>
              {converted?.lines?.join('\n') ?? ''}
            </SyntaxHighlighter>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default App;
