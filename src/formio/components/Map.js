/**
 * A form widget to select a location on a Leaflet map.
 */
import React from 'react';
import ReactDOM from 'react-dom';

import {Formio} from 'react-formio';

import LeafletMap from 'components/Map';

const Field = Formio.Components.components.field;


export default class Map extends Field {
  static schema(...extend) {
    return Field.schema({
      type: 'map',
      label: 'Map',
      key: 'map',
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Map',
      icon: 'map',
      weight: 500,
      schema: Map.schema()
    };
  }

  get inputInfo() {
    const info = super.elementInfo();
    // Hide the input element
    info.attr.type = 'hidden';
    return info;
  }

  get defaultSchema() {
    return Map.schema();
  }

  get emptyValue() {
    return '';
  }

  /**
   * Check if a component is eligible for multiple validation.
   *
   * Overridden to not perform this, since values are arrays of [lat, long] which *looks*
   * like multi-value but isn't.
   *
   * @return {boolean}
   */
  validateMultiple() {
    return false;
  }

  render() {
    return super.render(
      `<div ref="element">
        ${this.renderTemplate('map')}
      </div>`
    );
  }

  /**
   * Defer to React to actually render things - this keeps components DRY.
   * @param  {[type]} element [description]
   * @return {[type]}     [description]
   */
  attach(element) {
    this.loadRefs(element, {
      mapContainer: 'single',
    });
    this.renderReact();
    return super.attach(element);
  }

  renderReact() {
    const markerCoordinates = this.getValue();
    ReactDOM.render(
      <LeafletMap
        markerCoordinates={markerCoordinates || null}
        onMarkerSet={newLatLng => this.setValue(newLatLng)}
      />,
      this.refs.mapContainer,
    );
  }

  setValue(value, flags = {}) {
    const changed = super.setValue(value, flags);
    if (changed) {
      this.renderReact();
    }
    return changed;
  }
}