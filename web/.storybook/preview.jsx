import React, { useEffect, useRef } from 'react';

const preview = {
  parameters: { 
    layout: 'fullscreen', 
    pixi: {
      applicationOptions: {
        backgroundColor: 0x1099bb,
        resolution: 1,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const containerRef = useRef(null);

      useEffect(() => {
        let app = null;
        let storyInstance = null;
        let isDestroyed = false;

        const initContainerStory = async () => {
          if (!containerRef.current) return;

          const rawStoryFn = context.originalStoryFn;
          const storyData = typeof rawStoryFn === 'function' 
            ? rawStoryFn(context.args, context) 
            : Story();

          if (!storyData || typeof storyData !== 'object') return;

          const { Application, Container } = await import('pixi.js');
          const globalPixiArgs = context.parameters?.pixi?.applicationOptions || {};

          if (isDestroyed) return;

          app = new Application();
          await app.init({
            width: 500,
            height: 400,
            antialias: true,
            ...globalPixiArgs,
          });

          // If the effect was cleaned up while app.init was running, destroy it immediately
          if (isDestroyed) {
            if (app) {
              app.destroy(true, { children: true, texture: true });
            }
            return;
          }

          if (containerRef.current && app.canvas) {
            containerRef.current.appendChild(app.canvas);
          }

          const stageView = new Container();
          app.stage.addChild(stageView);

          if (typeof storyData.init === 'function') {
            storyData.init(stageView, context);
          } else if (storyData.view) {
            stageView.addChild(storyData.view);
          }

          if (typeof storyData.update === 'function') {
            app.ticker.add((tickerInstance) => {
              storyData.update(tickerInstance.deltaTime);
            });
          }

          storyInstance = storyData;
        };

        initContainerStory();

        return () => {
          isDestroyed = true;
          
          if (storyInstance && typeof storyInstance.destroy === 'function') {
            storyInstance.destroy();
          }
          
          if (app) {
            if (app.canvas && app.canvas.parentNode) {
              app.canvas.parentNode.removeChild(app.canvas);
            }
            app.destroy(true, { children: true, texture: true });
          } else {
            if (containerRef.current) {
              containerRef.current.innerHTML = '';
            }
          }
        };
      }, [Story, context, context.args]);

      return (
        <div style={{ padding: '20px' }}>
          <div ref={containerRef} style={{ display: 'inline-block', borderRadius: '4px', overflow: 'hidden' }} />
        </div>
      );
    },
  ],
};

export default preview;
