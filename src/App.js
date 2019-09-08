import React from 'react';
import Dropzone from './components/Dropzone'
import { PrimaryButton, Text, Stack, IconButton } from 'office-ui-fabric-react'
import { Slider } from 'office-ui-fabric-react/lib/Slider'
import { loadTheme } from 'office-ui-fabric-react/lib/Styling';
import { FontIcon } from 'office-ui-fabric-react/lib/Icon';
import { SwatchColorPicker } from 'office-ui-fabric-react/lib/SwatchColorPicker';
import { Card } from '@uifabric/react-cards';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { mergeStyles } from 'office-ui-fabric-react/lib/Styling';
import { initializeIcons } from '@uifabric/icons';
import copy from 'copy-to-clipboard';
import './App.css';
var fs = window.require('fs');
const electron = window.require("electron")
const nativeImage = electron.nativeImage
const { dialog } = window.require('electron').remote

initializeIcons();
const iconClass = mergeStyles({
  fontSize: 24,
  height: 24,
  width: 24,
  color: '#fff'
});

const cardClass = mergeStyles({
  backgroundColor: "#222",
  color: "#fff",
  display: "flex",
  justifyContent: "space-between"
});

const startCardClass = mergeStyles({
  backgroundColor: "#222",
  color: "#fff",
  display: "flex",
  justifyContent: "flex-start"
});



loadTheme({
  palette: {
    themePrimary: '#0078d4',
    themeLighterAlt: '#eff6fc',
    themeLighter: '#deecf9',
    themeLight: '#c7e0f4',
    themeTertiary: '#71afe5',
    themeSecondary: '#2b88d8',
    themeDarkAlt: '#106ebe',
    themeDark: '#005a9e',
    themeDarker: '#004578',
    neutralLighterAlt: '#f8f8f8',
    neutralLighter: '#f4f4f4',
    neutralLight: '#eaeaea',
    neutralQuaternaryAlt: '#dadada',
    neutralQuaternary: '#d0d0d0',
    neutralTertiaryAlt: '#c8c8c8',
    neutralTertiary: '#c2c2c2',
    neutralSecondary: '#858585',
    neutralPrimaryAlt: '#4b4b4b',
    neutralPrimary: '#f1f1f1',
    neutralDark: '#272727',
    black: '#1d1d1d',
    white: '#ffffff'
  }
});

class App extends React.Component {

  state = {
    files: [],
    fileInfos: [],
    viewerHeight: 0,
    imgSize: 86,
    imgIndex: 0,
    borderSize: 7,
    color: 'white',
    smallSide: 2200,
    exporting: false
  }

  imgRefs = []

  onDrop = (files) => {
    for (var i = 0; i < this.state.files.length + files.length; i++) {
      this.imgRefs[i] = React.createRef();
    }

    const smallSide = this.state.smallSide;

    const newFiles = files.map(f => {
      const image = nativeImage.createFromPath(f.path)
      const ratio = image.getAspectRatio()
      const size = image.getSize()
      const isHorizontal = ratio > 1

      return {
        image: image,
        ratio: ratio,
        size: size,
        finalSize: {
          height: isHorizontal ? smallSide : size.height * (smallSide / size.width),
          width: !isHorizontal ? smallSide : size.width * (smallSide / size.height)
        },
        path: f.path,
        name: f.name.replace(".jpg", "")
      }
    })

    this.setState({ files: [...this.state.files, ...newFiles] }, () => {
      setTimeout(() => this.generateFileInfo(), 200)
    })
  }

  componentDidMount() {
    document.onkeydown = this.checkKey;
  }

  checkKey = (e) => {
    if (e.keyCode === 37) {
       this.prevImg();
    }
    else if (e.keyCode === 39) {
       this.nextImg();
    }
  }

  generateFileInfo = () => {
    const smallSide = this.state.smallSide;
    const updatedFilesInfos = this.state.files.map((f, i) => {
      console.log("INDEX", i, this.imgRefs[i].current.width)
      const width = this.imgRefs[i].current.width
      const height = this.imgRefs[i].current.height

      console.log(width, height)

      return {
        size: f.size,
        finalSize: f.finalSize,
        ratio: f.ratio,
        scale: ((f.ratio < 1 ? width : height) / smallSide * ((f.ratio < 1 ? 1920/1000 : 1080/562.5)) * 100).toFixed(2),
      }
    })

    this.setState({ fileInfos: updatedFilesInfos })

    console.log("INFOS", updatedFilesInfos)
  }

  nextImg = () => {
    const { imgIndex, files } = this.state
    this.setState({ imgIndex: imgIndex + 1 === files.length ? 0 : imgIndex + 1 })
  }

  prevImg = () => {
    const { imgIndex, files } = this.state
    this.setState({ imgIndex: imgIndex - 1 === -1 ? files.length - 1  : imgIndex - 1 })
  }

  generate = async () => {
    this.setState({ exporting: true })

    const paths = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    const { files, fileInfos, borderSize, color } = this.state

    let finishCount = 0;

    if (paths.filePaths[0]) {
      files.forEach(async (file, i) => {
        const filename = `${paths.filePaths[0]}/${file.name}_@${(fileInfos[i].scale).toString().replace(".", "-")}.jpg`

        file.image = await file.image.resize({ width: file.finalSize.width, height: file.finalSize.height })
        const base64Img = await file.image.toDataURL()

        const width = this.imgRefs[i].current.width
        const height = this.imgRefs[i].current.height

        const smallSize = file.ratio < 1 ? width : height
        const borderWidth = (borderSize / smallSize) * 2200;

        var canvas = document.createElement('canvas');
        canvas.width = file.finalSize.width + borderWidth * 2;
        canvas.height = file.finalSize.height + borderWidth * 2;
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var cImg = new Image();
        cImg.src = base64Img;

        cImg.onload = async () => {
          ctx.drawImage(cImg, borderWidth, borderWidth);

          const finalImg = nativeImage.createFromDataURL(canvas.toDataURL())
          const buff = await finalImg.toJPEG(100)
          fs.writeFile(filename, buff, (err) => {
            if (err) console.error('err', err)
            else console.log("Completed", file.name)

            finishCount = finishCount + 1
            console.log(finishCount, files.length)
            if (finishCount === files.length) {
              this.setState({ exporting: false })
            }
          })
        }

      })
      
    } else {
      this.setState({ exporting: false })
    }

  }

  render () {
    const { imgSize, files, imgIndex, borderSize, fileInfos, color, exporting } = this.state

    return (
      <div className="App">

        <nav className="navbar">
          <div className="separator">
            <div className="section">
              <h1 className="title">Image Border</h1>
            </div>
            <div className="slider">
              <Slider
                min={70}
                max={98}
                step={1}
                defaultValue={86}
                showValue={true}
                disabled={!files.length}
                onChange={(value) => { this.setState({ imgSize: value }, () => this.generateFileInfo()) }}
              />
            </div>
            <div className="slider">
              <Slider
                min={0}
                max={30}
                step={1}
                defaultValue={7}
                showValue={true}
                disabled={!files.length}
                onChange={(value) => this.setState({ borderSize: value })}
              />
            </div>
            <div className="section">
              <SwatchColorPicker
                columnCount={2}
                selectedId={this.state.color}
                cellShape={'circle'}
                disabled={!files.length}
                onColorChanged={(id, color) => this.setState({ color: id })}
                colorCells={[
                  { id: 'white', label: 'white', color: '#fff' },
                  { id: 'black', label: 'black', color: '#000' }
                ]}
              />
            </div>
          </div>
          <div className="separator">
            <div className="section">
              {files.length ? imgIndex + 1 : 0} / {files.length} 
            </div>
            <div className="section">
              <FontIcon iconName="ChevronLeft" className={iconClass} onClick={this.prevImg} />
              <FontIcon iconName="ChevronRight" className={iconClass} onClick={this.nextImg} />
            </div>
            <div className="section">
              <PrimaryButton text="Generate" onClick={this.generate} allowDisabledFocus disabled={!files.length || exporting} />
            </div>
            {!!exporting && <div className="section">
              <Spinner size={SpinnerSize.medium} />
            </div>}
          </div>
          
          
        </nav>

        {!!files.length && <div className="viewer" style={{ backgroundColor: color === "white" ? "#000" : "#fff" }}>
          <div className="viewer-content" style={{ width: `${files.length * 100}%`, transform: `translateX(-${imgIndex / files.length * 100}%)` }}>
            {files.map((file, i) => <div className="viewer-img" style={{ width: `${100 / files.length}%` }} key={i}>
              <img ref={this.imgRefs[i]} style={{ maxHeight: `${imgSize}%`, maxWidth: `${imgSize}%`, borderWidth: borderSize, borderColor: color }} alt="" src={`file://${file.path}`} />
            </div>)}
          </div>
        </div>}

        <div className="container">
          {fileInfos[imgIndex] && <div>
            
            <Stack horizontal horizontalAlign="space-between">
              <Card compact tokens={{ childrenMargin: 12 }} className={cardClass}>
                <Card.Item>
                    <Text><b>Scale</b> {fileInfos[imgIndex].scale}%</Text>
                </Card.Item>
                <Card.Item>
                  <IconButton iconProps={{ iconName: 'Copy' }} title="Copy" ariaLabel="Copy" onClick={() => copy(fileInfos[imgIndex].scale)} />
                </Card.Item>
              </Card>
              <Card compact tokens={{ childrenMargin: 12 }} className={startCardClass}>
                <Card.Item>
                  <Text><b>Resized</b></Text>
                </Card.Item>
                <Card.Item>
                  <Text><b>Height:</b> {Math.round(fileInfos[imgIndex].finalSize.height)}px</Text>
                </Card.Item>
                <Card.Item>
                  <Text><b>Width:</b> {Math.round(fileInfos[imgIndex].finalSize.width)}px</Text>
                </Card.Item>
              </Card>
              <Card compact tokens={{ childrenMargin: 12 }} className={startCardClass}>
                <Card.Item>
                  <Text><b>Original</b></Text>
                </Card.Item>
                <Card.Item>
                  <Text><b> Height:</b> {Math.round(fileInfos[imgIndex].size.height)}px</Text>
                </Card.Item>
                <Card.Item>
                  <Text><b>Width:</b> {Math.round(fileInfos[imgIndex].size.width)}px</Text>
                </Card.Item>
              </Card>
            </Stack>
            

          </div>}
        </div>

        <div className="container">
          <Dropzone onDrop={this.onDrop}></Dropzone>
        </div>
  
      </div>
    );
  }
}

export default App;
