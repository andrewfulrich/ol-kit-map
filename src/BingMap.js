import React, { Component } from 'react'
import { Controls, Map, Popup, LayerPanel, loadDataLayer } from '@bayer/ol-kit'
import olStyle from 'ol/style/style'
import olStroke from 'ol/style/stroke'
import olFill from 'ol/style/fill'
import olText from 'ol/style/text'
import olExtent from 'ol/extent'
import olProj from 'ol/proj';
import olMap from 'ol/map'
import olView from 'ol/view'
import TileLayer from 'ol/layer/tile';
import BingMaps from 'ol/source/bingmaps';
import OSM from 'ol/source/osm';
import { ZoomControls } from '@bayer/ol-kit/core/Controls'

class BingMap extends Component {
  constructor(props) {
    super(props)
    const bingy=new BingMaps({
      key: 'YOUR KEY HERE',
      imagerySet: 'RoadOnDemand',
      mapLayer:'Background',
      tileLoadFunction:function(tile, src) {
        //hide labels
        tile.getImage().src = src.replace('it=G,L','it=G');
        // console.log(tile)
      }
      // projection: olProj.createProjection('EPSG:4326')
    })
    // console.log('proj:',olProj.createProjection('EPSG:4326'))
    this.myMap = new olMap({
      view: new olView({
        center: [0, 0],
        zoom: 1
      }),
      layers: [
        new TileLayer({
          // customMapStyle: myStyle,
          opacity:1,
          visible:true,
          source: bingy
        })
      ],
      target: 'map'
    })
  }
  render() {

    const onMapInit = async map => {
      console.log('we got a map!', map)
      window.map = map
      console.log(map.getLayers())
      
      const munies = await loadDataLayer(map,'https://maps.stlouisco.com/arcgis/rest/services/OpenData/OpenData/FeatureServer/6/query?where=1%3D1&outFields=MUNICIPALITY,last_edited_date,GlobalID&outSR=4326&f=geojson')
      const neighborhoods = await loadDataLayer(map, 'https://maps6.stlouis-mo.gov/arcgis/rest/services/Hosted/Neighborhood_Boundaries/FeatureServer/0/query?f=geojson&where=1=1&returnGeometry=true&outSR=4326&cacheHint=true')
      
      // const streetNameLayer=await loadDataLayer(map,'https://maps.stlouisco.com/arcgis/rest/services/OpenData/OpenData/FeatureServer/1/query?where=1%3D1&outFields=FULL_NAME&outSR=4326&f=geojson')
      // const streetFeatures=streetNameLayer.getSource().getFeatures()
      // streetFeatures.forEach(sf=>{
        // sf.setStyle(new olStyle({
          // text: new Text({
          //   font: '12px Calibri,sans-serif',
          //   overflow: true,
          //   fill: new olFill({
          //     color: '#000'
          //   }),
          //   stroke: new olStroke({
          //     color: '#fff',
          //     width: 3
          //   }),
          //   text:sf.get('FULL_NAME')
          // })
      //   }))
      // })
      // console.log('streetFeatures',streetNameLayer)
      function getFontSize() {
        return map.getView().getZoom()
        // switch(true) {
        //   case  zoom < 11:
        //     return 8;
        //   case zoom < 13:
        //     return 10;
        //   case zoom < 14:
        //     return 14;
        //   case zoom < 16:
        //     return 16;
        //   default: return 20;
        // }
      }
      function getMunyText(feature) {
        return (feature.get('MUNICIPALITY').toLowerCase()+'').split(' ').map(name=>name[0].toUpperCase()+name.substring(1)).join(' ').replace('Unincorporated','')
      }
      function showLabel(feature,isNeighborhood) {
        feature.setStyle(new olStyle({
          fill: new olFill({
            color: 'rgba(255, 255, 255, 0.3)'
          }),
          stroke: new olStroke({//
            color: 'blue'
          }),
          text:new olText({ // from https://openlayers.org/en/latest/examples/vector-labels.html and https://openlayers.org/en/latest/examples/vector-label-decluttering.html
            font: `${getFontSize()}px Calibri,sans-serif`,
            overflow: true,
            fill: new olFill({
              color: '#000'
            }),
            stroke: new olStroke({
              color: '#fff',
              width: 3
            }),
            text:isNeighborhood? feature.get('nhd_name') : getMunyText(feature)
          })
        }))
      }
      function hideLabel(feature) {
        feature.setStyle(new olStyle({
          fill: new olFill({
            color: 'rgba(255, 255, 255, 0.3)'
          }),
          stroke: new olStroke({//
            color: 'black'
          }),
          text:new olText({ // from https://openlayers.org/en/latest/examples/vector-labels.html and https://openlayers.org/en/latest/examples/vector-label-decluttering.html
            font: `${getFontSize()}px Calibri,sans-serif`,
            overflow: true,
            fill: new olFill({
              color: '#000'
            }),
            stroke: new olStroke({
              color: '#fff',
              width: 3
            }),
            text:''
          })
        }))
      }
      function highlight(feature) {
        feature.setStyle(new olStyle({
          fill: new olFill({
            color: 'rgba(0,0, 255, 0.3)'
          }),
          stroke: new olStroke({//
            color: 'blue'
          }),
          text:new olText({ // from https://openlayers.org/en/latest/examples/vector-labels.html and https://openlayers.org/en/latest/examples/vector-label-decluttering.html
            font: `${getFontSize()}px Calibri,sans-serif`,
            overflow: true,
            fill: new olFill({
              color: '#000'
            }),
            stroke: new olStroke({
              color: '#fff',
              width: 3
            }),
            text:''
          })
        }))
      }
      const features=neighborhoods.getSource().getFeatures()
      
      const rawmunyFeatures=munies.getSource().getFeatures()
      const irrelevant=rawmunyFeatures.filter(f=>f.get('MUNICIPALITY').toLowerCase()=='UNINCORPORATED'.toLowerCase())
      const munySource=munies.getSource()
      irrelevant.forEach(f=>munySource.removeFeature(f))
      const munyFeatures=munies.getSource().getFeatures()
      // console.log('irrelevant',irrelevant)
      // console.log('munyFeature: ',munyFeatures[0])
      
      function zoomToFeature(feature) {
        const extent=feature.getGeometry().getExtent()
        // const center=olProj.toLonLat(olExtent.getCenter(extent))
        //centerAndZoom(map,{y:center[1],x:center[0],zoom:16})

        // var extent = my_vector_layer.getSource().getExtent();
        map.getView().fit(extent, map.getSize());
        map.getView().setZoom(map.getView().getZoom()-0.7)
      }
      /******zoomToFeature(tif)*******/
      
      // const request = await fetch('https://maps6.stlouis-mo.gov/arcgis/rest/services/Hosted/Neighborhood_Boundaries/FeatureServer/0/query?f=geojson&where=1=1&returnGeometry=true&outSR=4326&cacheHint=true')
      // const data = await request.json()
      // const names=data.features.map(f=>f.properties.nhd_name)
      // console.log(names)
      
      function updateCityCountyBoth(cityCountyBoth) {
        /**************** fit zoom to both layers *******************/
        const combinedExtent=olExtent.createEmpty()
        if(cityCountyBoth=='Both' || cityCountyBoth=='County') {
          olExtent.extend(combinedExtent, munies.getSource().getExtent());
        }
        if(cityCountyBoth=='Both' || cityCountyBoth=='City') {
          olExtent.extend(combinedExtent, neighborhoods.getSource().getExtent());
        }
        map.getView().fit(combinedExtent, map.getSize());
        map.getView().setZoom(map.getView().getZoom()+0.5)
        /**************** /fit zoom to both layers *******************/

        if(cityCountyBoth=='City') {
          munies.setVisible(false)
          neighborhoods.setVisible(true)
        }
        if(cityCountyBoth=='County') {
          neighborhoods.setVisible(false)
          munies.setVisible(true)
        }
        if(cityCountyBoth=='Both') {
          munies.setVisible(true)
          neighborhoods.setVisible(true)
        }
      }
      updateCityCountyBoth('Both')
      document.addEventListener('setCityCountyBoth',(e)=>{
        updateCityCountyBoth(e.detail)
      })
      

      function showAllLabels() {
        munyFeatures.forEach(f=>showLabel(f,false))
        features.forEach(f=>showLabel(f,true))
      }
      showAllLabels()

      /**************** get the next random thing *******************/
      function getNextThing(inQueue,maxInQueue) {
        console.log('in queue:',inQueue,'Max in Queue:',maxInQueue)
        munyFeatures.forEach(f=>showLabel(f))
        features.forEach(f=>showLabel(f,true))

        function setNextFeature(nf,isNeighborhood) {
          console.log("next feature: ",nf)
          highlight(nf,isNeighborhood)
          zoomToFeature(nf)

          const event=new CustomEvent('setName',{
            detail:isNeighborhood? nf.get('nhd_name') : getMunyText(nf)
          })
          document.dispatchEvent(event)
        }
        if(inQueue.length >= maxInQueue) {
          const nextIndex=Math.floor(Math.random()*maxInQueue)
          const needle=inQueue[nextIndex] || inQueue[0]
          const munyFeature=munyFeatures.find(f=>f.get('MUNICIPALITY').toLowerCase()==needle.toLowerCase())
          const cityFeature=features.find(f=>f.get('nhd_name').toLowerCase()==needle.toLowerCase())
          console.log(' city: ',cityFeature,' county: ',munyFeature,' in queue: ',inQueue,' max: ',maxInQueue,' finding: ',needle)
          if(munyFeature) {
            setNextFeature(munyFeature,false)
          } else {
            setNextFeature(cityFeature,true)
          }

        } else {
          const nextIndex=Math.floor(Math.random()*(munyFeatures.length+features.length-1))
          let nextFeature,isNeighborhood;
          if(nextIndex < munyFeatures.length) {
            nextFeature=munyFeatures[nextIndex]
            isNeighborhood=false; //todo: just add this as a property of the features
          } else {
            nextFeature=features[nextIndex-munyFeatures.length]
            if(nextFeature.get('MUNICIPALITY') == 'UNINCORPORATED') {
              console.log('got unincorporated') //this shouldn't happen anymore
              return getNextThing()
            }
            isNeighborhood=true
          }
          setNextFeature(nextFeature,isNeighborhood)
        }
        
      }
      document.addEventListener('getNext',e=>{
        getNextThing(e.detail.inQueue,e.detail.maxInQueue)
      })
      /**************** /get the next random thing *******************/

      console.log('dataLayer', neighborhoods)
      // centerAndZoom(map,{y:38.622042,x:-90.280927,zoom:12.52})
    }

    return (

<Map map={this.myMap} onMapInit={onMapInit}>
<Controls><ZoomControls /></Controls>
      </Map>
      
    )
  }

}

export default BingMap
