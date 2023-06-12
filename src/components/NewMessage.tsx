// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { Button, IconButton, Paper, TextField } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { postMessage } from '../api/messages';
import { Contact, Message } from 'microsoft-graph';
import { useTranslation } from 'react-i18next';
import { Delete, ImportContacts } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setGABOpen } from '../actions/gab';
import { useTypeSelector } from '../store';
import { ActionButton } from './messages/MailActions';
import WarningIcon from '@mui/icons-material/Warning';
import Popover from '@mui/material/Popover';


const styles: any = (theme: any) => ({
  content: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
  },
  tinyMceContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 16,

  },
  button: {
    margin: theme.spacing(0, 1),
  },
  input: {
    margin: theme.spacing(1, 0),
  },
  flexRow: {
    display: 'flex',
  },
  actions: {
    display: 'flex',
    marginBottom: 16,
    padding: 9,
  },
  iconButtonRow: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  extraFieldsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1em',
    justifyContent: 'flex-end'
  },
  extraFields: {
    cursor: 'pointer',
    transition: 'all 250ms ease-in-out',
    "&:hover": {
      textDecoration: 'underline',
      textUnderlineOffset: '10px'
    },
  },
  importanceLevelDropdown: {
    borderRadius: '4px',
    boxShadow: '0 0 6px 0 rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
    listStyleType: 'none',
    padding: 0,
  },
  importanceLevelItem: {
    padding: '10px 20px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',

    "&:hover": {
      backgroundColor: '#f6f6f6',
    },
  }
});

type MessagesProps = {
  classes: any,
  handleTabLabelChange: (label: string) => void,
  handleDraftClose: () => void,
  initialState?: Message,
}
type ImportanceLevel = 'high' | 'low' | 'normal'

function NewMessage({ classes, handleTabLabelChange, handleDraftClose, initialState }: MessagesProps) {
  const app = useAppContext();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const editorRef = useRef<any>(null);
  const selectedGABReceipients = useTypeSelector(state => state.gab.seletion);
  const [toRecipients, setToRecipients] = useState(initialState?.toRecipients?.map(recip => recip.emailAddress?.address || "").join(",") || "");
  const [subject, setSubject] = useState(initialState?.subject || "");
  const [cc, setCc] = useState(initialState?.ccRecipients || '')
  const [bcc, setBcc] = useState(initialState?.bccRecipients || '')
  const [extraFieldsActive, setExtraFieldsActive] = useState({ bcc: false, cc: false })
  const [importanceLevel, setImportanceLevel] = useState<ImportanceLevel | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const stateFuncs: any = {
    'setToRecipients': setToRecipients,
    'setSubject': setSubject,
  }

  const handleSend = (send: boolean) => () => {
    const message: Message = {
      subject,
      body: {
        contentType: 'html',
        content: editorRef.current ? editorRef.current.getContent() : '',
      },
      importance: importanceLevel!,
      toRecipients: toRecipients.split(',').map((address: string) => ({
        emailAddress: {
          address,
        },
      })),
    }
    postMessage(app.authProvider!, message, send)
      .then(handleDraftClose);
  }

  const handleInput = (stateFunc: string) => (e: ChangeEvent<HTMLInputElement>) => {
    stateFuncs[stateFunc]((e.target as HTMLInputElement).value);
  }

  const handleSubject = (e: ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setSubject(value);
    handleTabLabelChange(value);
  }

  const handleCC = (e: ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setCc(value);
  }
  const handleBcc = (e: ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setBcc(value);
  }

  const handleSetImportanceLevel = (level: ImportanceLevel) => {
    setImportanceLevel(level)
    handleClose()
    return
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const handleGAB = () => {
    dispatch(setGABOpen(true));
  }

  useEffect(() => {
    if (selectedGABReceipients.length > 0) setToRecipients(toRecipients + (toRecipients && ",") +
      selectedGABReceipients.map((contact: Contact) => {
        return contact.emailAddresses ? contact.emailAddresses[0].address : ''
      }).join(','));
  }, [selectedGABReceipients]);

  return (
    <div className={classes.content}>

      <Paper className={classes.actions}>
        <Button
          onClick={handleSend(false)}
          variant='contained'
          color="primary"
        >
          {t("Save")}
        </Button>
        <Button
          className={classes.button}
          onClick={handleSend(true)}
          variant='contained'
          color="primary"
        >
          {t("Send")}
        </Button>
        <div className={classes.iconButtonRow}>
          <IconButton title={t('Discard') || ""} onClick={handleDraftClose /* TODO: Prompt confirmation dialog */}>
            <Delete />
          </IconButton>
        </div>
      </Paper>
      <Paper className={classes.tinyMceContainer}>
        <div className={classes.extraFieldsContainer}>
          <div>
            <ActionButton
              aria-describedby={id}
              key={1}
              onClick={handleClick} startIcon={<WarningIcon />}
            >
              {t(importanceLevel ?? 'Set Priority Level')}
            </ActionButton>

            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'center',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
              <ul className={classes.importanceLevelDropdown}>
                <li onClick={() => handleSetImportanceLevel('low')} className={classes.importanceLevelItem}>Low</li>
                <li onClick={() => handleSetImportanceLevel('normal')} className={classes.importanceLevelItem}>Normal</li>
                <li onClick={() => handleSetImportanceLevel('high')} className={classes.importanceLevelItem}>High</li>
              </ul>
            </Popover>
          </div>


          <span
            onClick={() => setExtraFieldsActive({
              ...extraFieldsActive,
              cc: !extraFieldsActive.cc
            })}
            className={classes.extraFields}>
            CC
          </span>
          <span
            onClick={() => setExtraFieldsActive({
              ...extraFieldsActive,
              bcc: !extraFieldsActive.bcc
            })}
            className={classes.extraFields}>
            BCC
          </span>

        </div>


        <div className={classes.flexRow}>
          <IconButton onClick={handleGAB}>
            <ImportContacts />
          </IconButton>
          <TextField
            className={classes.input}
            label={t("Recipients")}
            onChange={handleInput('setToRecipients')}
            value={toRecipients}
            fullWidth
          />
        </div>
        {extraFieldsActive.cc && (
          <TextField
            className={`animate__animated animate__fadeIn ${classes.input}`}
            label={t("CC")}
            onChange={handleCC}
            value={cc}
            fullWidth
          />
        )}

        {extraFieldsActive.bcc && (
          <TextField
            className={`animate__animated animate__fadeIn ${classes.input}`}
            label={t("BCC")}
            onChange={handleBcc}
            value={bcc}
            fullWidth
          />
        )}

        <TextField
          className={classes.input}
          label={t("Subject")}
          onChange={handleSubject}
          value={subject}
          fullWidth
        />


        <Editor
          tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
          onInit={(evt, editor) => editorRef.current = editor}
          initialValue={initialState?.body?.content || ''}
          init={{
            id: 'tinyMCE-editor',
            language: i18n.language,
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          }}

        />
      </Paper>
    </div>
  );
}


export default withStyles(styles)(NewMessage);
