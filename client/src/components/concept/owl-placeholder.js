import React from 'react';

export default () => (
  <div style={{
            display: 'flex', width: '512px', height: '512px', margin: '0 auto',
            flexDirection: 'column', textAlign: 'center', color: 'white',
            borderRadius: '50%', overflow: 'hidden', backgroundColor: '#3F51B5',
            boxShadow: 'inset 0 0 2px rgba(0,0,0,.12),inset 0 2px 4px rgba(0,0,0,.24)'
          }}>
    <img src={require('./owl-only.png')}
         style={{margin: '70px auto 0'}}/>
        <span style={{fontSize: 35, marginTop: 20}}>
          No concept selected.
        </span>
        <span style={{fontSize: 16, marginTop: 20}}>
          You can select concepts on the left side.
          <div style={{fontSize: 50, marginTop: 20}}>←</div>
        </span>
  </div>
);
