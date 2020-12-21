import {
  Box,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel, TextField
} from "@material-ui/core";
import React, {useEffect, useMemo, useState} from "react";
import Immutable from 'immutable';
import {
  defaultTargetLanguages,
  inferenceFlags,
  defaultInferenceFlags,
  OptionDefinition,
  TargetLanguage
} from 'quicktype/dist/quicktype-core';
import {OptionKind} from "quicktype/dist/quicktype-core/RendererOptions";
import humanizeString from "humanize-string";

const languageMap: Map<string, TargetLanguage> = new Map(defaultTargetLanguages.map(value => [value.name, value]));

export const Options = ({onChanged}: {
  onChanged?: (
    language: TargetLanguage,
    options: Immutable.Map<OptionDefinition, any>
  ) => void,
}) => {
  const [tab, setTab] = useState(0);
  const [selectedLanguage, setLanguage] = useState(defaultTargetLanguages[0].name);
  const language = useMemo(() => languageMap.get(selectedLanguage)!, [selectedLanguage]);
  const [options, setOptions] = useState<Immutable.Map<OptionDefinition, any>>(Immutable.Map())
  useEffect(
    () => setOptions(() => Immutable.Map(language.optionDefinitions.map(option => [option, option.defaultValue]))),
    [language]
  );

  useEffect(() => onChanged?.(language, options), [language, options]);

  const panels = [
    <Box>
      <FormControl>
        <InputLabel id="language-select-label-id">
          Language
        </InputLabel>
        <Select labelId="language-select-label-id" id="language-select-id" value={selectedLanguage}
                onChange={(event) => setLanguage(event.target.value as string)}>
          {defaultTargetLanguages.map(lang => <MenuItem key={lang.name}
                                                        value={lang.name}>{lang.displayName}</MenuItem>)}
        </Select>
      </FormControl>
      <OptionsList language={language} type={tab == 0 ? 'primary' : 'secondary'}
                   options={options}
                   onOptionChanged={(option, value) => setOptions(options.set(option, value))}/>
    </Box>,
    <Box>
      <OptionsList language={language} type={tab == 0 ? 'primary' : 'secondary'}
                   options={options}
                   onOptionChanged={(option, value) => {
                     setOptions(options.set(option, value));
                   }}/>
      {/*{*/}
      {/*  Object.entries(inferenceFlags).map(([name, details]) => {*/}
      {/*    return <p key={name}>{name}: {details.description}</p>*/}
      {/*  })*/}
      {/*}*/}
    </Box>,
  ];

  return (
    <Paper style={{width: "380px", maxHeight: '100vh', boxSizing: 'border-box'}} elevation={6}>
      <Box p={2}>
        <Tabs value={tab} onChange={(event, nextValue) => setTab(nextValue)}>
          <Tab label="Language"/>
          <Tab label="Other"/>
        </Tabs>
        <Box height={10}/>
        {panels[tab]}
      </Box>
    </Paper>
  );
};

function capitalizeWords(str: string) {
  return str.replace(/\w\S*/g, function (txt: string) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

const OptionsList = ({language, type, options, onOptionChanged}: {
  language: TargetLanguage,
  type: OptionKind,
  options: Immutable.Map<OptionDefinition, any>
  onOptionChanged: (option: OptionDefinition, value: any) => void,
}) => {
  return <>
    {language.optionDefinitions
      .filter(option => option.kind == type)
      .map(option => {
        if (typeof option.type() == "boolean") {
          return <FormControlLabel control={<Switch value={options.get(option) ?? option.defaultValue}
                                                    onChange={(event, checked) => onOptionChanged(option, checked)}/>}
                                   label={option.description}/>
        } else {
          const isEnum = (option.legalValues?.length ?? 0) > 0;
          if (isEnum) {
            const legalValues = option.legalValues!;
            return <FormControl style={{display: "block"}}>
              <InputLabel id={`${option.name}-select-label-id`}>
                {option.description}
              </InputLabel>
              <Select labelId={`${option.name}-select-label-id`}
                      id={`${option.name}-select-id`}
                      value={options.get(option) ?? option.defaultValue}
                      onChange={(event) => {
                        console.log(event)
                        onOptionChanged(option, event.target.value);
                      }}>
                {legalValues.map(option => <MenuItem key={option}
                                                     value={option}>{capitalizeWords(humanizeString(option))}</MenuItem>)}
              </Select>
            </FormControl>;
          }
          return <TextField label={option.description}
                            style={{width:'100%'}}
                            value={options.get(option) ?? option.defaultValue}
                            onChange={event => onOptionChanged(option, event.target.value)}
          />;
        }
      }).map((child, index) => <Box key={index} my={2}>{child}</Box>)}
  </>;
};
