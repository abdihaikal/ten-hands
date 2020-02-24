import { IResizeEntry, ResizeSensor } from "@blueprintjs/core";
import debounce from "lodash/debounce";
import React, { useEffect } from "react";
import styled from "styled-components";
import { useConfig } from "../shared/stores/ConfigStore";
import JobTerminal from "../shared/JobTerminal";
import JobTerminalManager from "../shared/JobTerminalManager";
import { useTheme } from "../shared/stores/ThemeStore";

interface ICommandProps {
  room: string;
  index: number;
}

const TerminalContainer = styled.div`
  flex: 1;
  padding: 10px;
  white-space: pre-wrap;
`;

const CommandOutputXterm: React.FC<ICommandProps> = React.memo(
  ({ room, index }) => {
    const elRef = React.useRef<HTMLDivElement>(null);
    const terminal = React.useRef<JobTerminal | null>(null);
    const { theme } = useTheme();
    const currentTheme = React.useRef<any>(null);
    const themeTimeout = React.useRef<any>(null);
    // const terminalAttached = React.useRef<boolean>(false);
    const { config } = useConfig();

    const setTheme = () => {
      if (terminal && terminal.current) {
        terminal.current.setTheme(theme);
        if (currentTheme && currentTheme.current) {
          currentTheme.current = theme;
        }
      }
    };

    const removeTheme = () => {
      if (terminal && terminal.current) {
        terminal.current.removeTheme();
      }
    };

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
      if (elRef && elRef.current) {
        if (terminal.current === null) {
          terminal.current = JobTerminalManager.getInstance().createJobTerminal(
            room
          );
          terminal.current.attachTo(elRef.current);
        }
      }
    }, []);

    useEffect(() => {
      if (!config.enableTerminalTheme) {
        removeTheme();
      }

      setTheme();

      return () => {
        // Remove unmounting
        removeTheme();
        if (themeTimeout.current) {
          clearTimeout(themeTimeout.current);
        }
      };
    }, [theme, config, index]);

    const handleResize = React.useCallback(
      debounce((entries: IResizeEntry[]) => {
        let resizeTimeout: any = null;
        const resizeLater = () => {
          resizeTimeout = setTimeout(() => {
            if (terminal && terminal.current && entries.length > 0) {
              const width: number = entries[0].contentRect.width;
              terminal.current.resizeTerminal(width);
            }
          }, 0);
        };
        resizeLater();
        return () => {
          clearTimeout(resizeTimeout);
        };
      }, 50),
      [terminal]
    );

    return (
      // <ResizeSensor onResize={handleResize}>
      <div>
        <TerminalContainer ref={elRef} />
      </div>
      // </ResizeSensor>
    );
  }
);

export default CommandOutputXterm;
