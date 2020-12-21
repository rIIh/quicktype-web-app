import React, {useMemo, useRef, useState} from "react";
import Immutable from 'immutable';
import AceEditor from "react-ace";
import createPersistedState from 'use-persisted-state';

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-solarized_dark";

import "./App.css";
import {
  quicktype, jsonInputForTargetLanguage, TargetLanguage, OptionDefinition, InputData, defaultTargetLanguages,
} from "quicktype/dist/quicktype-core";
import {
  AppBar,
  Container,
  Toolbar,
  Button,
  Icon,
  Box,
  Popper, Grid, Input, Select, MenuItem, ThemeProvider, createMuiTheme, IconButton,
} from "@material-ui/core";
import {VisibilityRounded, VisibilityOffRounded, InfoOutlined, GitHub} from "@material-ui/icons";
import {Options} from "./components/Options";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/default-highlight";
import {useAsyncMemo} from "use-async-memo";
import produce from "immer";

enum InputSource {
  json = 'JSON',
  multiple = 'Multiple JSON',
  schema = 'JSON Schema',
  typescript = 'Typescript',
  postman = 'Postman v2.1',
}


interface PersistedState {
  name: string;
  inputType: string;
  language: string;
  options: Record<string, any>;
  json: string;
}

interface State {
  name: string;
  inputType: string;
  language: TargetLanguage;
  options: Immutable.Map<OptionDefinition, any>;
  json: string;
}

const useAppState = createPersistedState('app_state', localStorage);

function App() {
  const appBar = useRef();
  const [showOptions, setShowOptions] = useState(true);
  const [persistedState, setState] = useAppState<PersistedState>({
    language: defaultTargetLanguages[0].name,
    name: 'Welcome',
    inputType: 'json',
    options: Immutable.Map(defaultTargetLanguages[0].optionDefinitions.map(option => [option.name, option.defaultValue])),
    json: `
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
}`
  });

  const computedState = useMemo<State>(() => {
    const language = defaultTargetLanguages.find(value => value.name == persistedState.language)!;
    const options = Immutable.Map(language.optionDefinitions.map(option => [option, persistedState.options[option.name]]));
    return ({
      name: persistedState.name,
      json: persistedState.json,
      inputType: persistedState.inputType,
      language: language,
      options: options,
    });
  }, [persistedState]);

  /*  const [name, setName] = useState(loadSave()?.name ?? 'Welcome');
    const [inputType, setInputType] = useState(loadSave()?.inputType ?? 'json');

    const [language, setLanguage] = useState<TargetLanguage>(loadSave()?.language ?? defaultTargetLanguages[0]);
    const [options, setOptions] = useState<Immutable.Map<OptionDefinition, any> | undefined>(loadSave()?.options ?? Immutable.Map(
      language.optionDefinitions.map(option => [option, option.defaultValue])
    ));*/
  /*
    const [json, setJson] = useState(loadSave()?.json ?? `
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
  `);*/

  const converted = useAsyncMemo(async () => {
    try {
      const input = jsonInputForTargetLanguage(persistedState.language);
      await input.addSource({
        name: persistedState.name,
        samples: [persistedState.json],
      });

      const inputData = new InputData();
      inputData.addInput(input);

      const rendererOptions = computedState.options.map((value, key) => ({[key.name]: value}))
        .reduce((acc, pair) => ({...acc, ...pair}), {});

      return quicktype({
        lang: persistedState.language,
        rendererOptions: rendererOptions,
        inputData: inputData,
      });
    } catch (e) {
      console.warn(e);
      return null;
    }
  }, [persistedState]);

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
          <Options initial={computedState} onChanged={(language, options) => {
            setState((state) => produce(state, draft => {
              draft.language = language.name;
              draft.options = options.reduce((acc, value, key) => ({...acc, [key.name]: value}), {});
            }))
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
                    <Input style={{width: '100%'}} color={"primary"} value={persistedState.name}
                           onChange={event => setState(state => produce(state, draft => {
                             draft.name = event.target.value;
                           }))}/>
                  </Grid>
                  <Grid item xs>
                    <Select style={{width: '100%'}} value={persistedState.inputType}
                            onChange={event => setState(state => produce(state, draft => {
                              draft.inputType = event.target.value as InputSource;
                            }))}>
                      {Object.entries(InputSource)
                        .map(([key, name]) => <MenuItem key={key} disabled={key != 'json'}
                                                        value={key}>{name}</MenuItem>)}
                    </Select>
                  </Grid>
                </Grid>
                <Box height={10}/>
                <AceEditor
                  mode="json"
                  value={persistedState.json}
                  theme="solarized_dark"
                  onChange={value => setState(state => produce(state, draft => {
                    draft.json = value;
                  }))}
                  editorProps={{$blockScrolling: true}}
                  style={{width: "100%", flexGrow: 1}}
                />
              </ThemeProvider>
            </Box>
          </Grid>
          <Grid item xs style={{overflow: "hidden"}}>
            <SyntaxHighlighter language={computedState.language.name} customStyle={{height: '100%', margin: 0}}>
              {converted?.lines?.join('\n') ?? ''}
            </SyntaxHighlighter>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default App;
