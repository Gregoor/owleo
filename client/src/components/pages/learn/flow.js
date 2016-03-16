import React from 'react';
import Relay from 'react-relay';
import cola from 'webcola';
import d3 from 'd3';

import fromGlobalID from '../../../helpers/from-global-id';
import {CenteredSpinner} from '../../icons';

import './flow.scss';

class ConceptFlow extends React.Component {

  state = {isLoading: true};

  componentDidMount() {
    const self = this;
    self.navState = {x: 0, y: 0};
    const d3cola = this.cola = cola.d3adaptor().convergenceThreshold(0.1);

    const {svg} = this.refs;
    const {width, height} = svg.getBoundingClientRect();
    this.width = width;
    this.height = height;

    const outer = d3.select(svg).attr({width, height, 'pointer-events': 'all'});

    const background = outer.append('rect')
      .attr({class: 'background', width: '100%', height: '100%'});

    this.vis = outer.append('g');

    background.call(d3.behavior.drag().on('drag', function() {
      const {dx, dy} = d3.event;
      self.vis.classed('in-transition', false);
      self._setPosition(self.navState.x + dx, self.navState.y + dy);
    }));

    outer.append('svg:defs').append('svg:marker')
      .attr({
        id: 'end-arrow', viewBox: '0 -5 10 10', refX: 8,
        markerWidth: 6, markerHeight: 6, orient: 'auto'
      })
      .append('svg:path').attr({
        d: 'M0,-5L10,0L0,5L2,0', 'stroke-width': '0px', fill: '#000'
      });

    const {concepts} = this.props;

    this.conceptsMap = new Map(concepts.map(c => [fromGlobalID(c.id), c]));

    const idMap = new Map();

    const nodes = [];
    concepts.forEach(({id, name}, i) => {
      nodes.push({id: i, realID: id, name});
      idMap.set(id, i);
    });

    const edges = [];
    for (const concept of concepts) {
      for (const req of concept.reqs) {
        edges.push({
          sourceID: req.id, targetID: concept.id,
          source: idMap.get(req.id), target: idMap.get(concept.id),
          isContainer: req.id == concept.container.id
        });
      }
    }

    const distance = concepts.reduce((max, {name}) => Math.max(max, name.length), 0) * 6;

    d3cola
      .avoidOverlaps(true)
      .convergenceThreshold(1e-1)
      .flowLayout('y', distance)
      .nodes(nodes)
      .links(edges)
      .jaccardLinkLengths(distance);

    const idsToEls = this.idsToEls = new Map(concepts.map(({id}) => [
      fromGlobalID(id), {rect: null, label: null, links: []}
    ]));

    const link = this.vis.selectAll('.link')
      .data(edges)
      .enter().append('path')
      .attr('class', d => `link ${d.isContainer? 'is-container' : ''}`)
      .style('marker-end', 'url(#end-arrow)')
      .each(function({sourceID, targetID}) {
        //idsToEls.get(sourceID).links.push(this);
        idsToEls.get(fromGlobalID(targetID)).links.push(this);
      });

    const node = this.vis.selectAll('.node')
      .data(nodes)
      .enter().append('rect')
      .classed('node', true)
      .attr({rx: 5, ry: 5})
      .on('click', d => self.props.onSelect(d.realID))
      .each(function({realID}) { idsToEls.get(fromGlobalID(realID)).rect = this; });

    const margin = 5, pad = 6;
    const label = this.vis.selectAll('.label')
      .data(nodes)
      .enter().append('text')
      .attr('class', 'label')
      .text(d => d.name)
      .on('click', d => self.props.onSelect(d.realID))
      .each(function(d) {
        idsToEls.get(fromGlobalID(d.realID)).label = this;
        const {width, height} = this.getBBox();
        const extra = 2 * margin + 2 * pad;
        d.width = width + extra;
        d.height = height + extra;
      });

    const lineFunction = d3.svg.line()
      .x(d => d.x).y(d => d.y).interpolate('linear');

    const routeEdges = function() {
      d3cola.prepareEdgeRouting();
      link.attr('d', d => lineFunction(d3cola.routeEdge(d)));
    };

    d3cola.start(50, 100, 200).on('end', function() {
      let minX = 0, maxX = 0, minY = 0, maxY = 0;
      node
        .each(function(d) {
          d.innerBounds = d.bounds.inflate(-margin);
          const {x, y} = d.innerBounds;
          const width = d.innerBounds.width();
          const height = d.innerBounds.height();
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        })
        .attr({
          'x': d => d.innerBounds.x, 'y': d => d.innerBounds.y,
          'width': d => d.innerBounds.width(), 'height': d => d.innerBounds.height()
        });

      link.attr('d', function(d) {
        const route = cola.vpsc.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
        return lineFunction([route.sourceIntersection, route.arrowStart]);
      });

      label.attr({'x': d => d.x, 'y': d => d.y + (margin + pad) / 2});

      routeEdges();
      self.hasRendered = true;
      self._redraw();
      self.setState({isLoading: false, minX, maxX, minY, maxY});
      self._focus(self.props.selectedID);
    });
  }

  componentWillReceiveProps({concepts, selectedID}) {
    this.conceptsMap = new Map(concepts.map(c => [fromGlobalID(c.id), c]));
    if (this.hasRendered) {
      this._focus(selectedID);
      this._redraw();
    }
  }

  componentWillUnmount() {
    this.cola.on('end', null).stop();
  }

  render() {
    const {isLoading}  = this.state;
    return (
      <div {...this.props}>
        {isLoading ? <CenteredSpinner/> : ''}
        <svg ref="svg" className="flow"
             style={{visibility: isLoading ? 'hidden' : 'visible'}}/>
      </div>
    );
  }

  _focus(id) {
    const {rect, links} = this.idsToEls.get(id);
    let {x, y, width, height} = rect.getBBox();
    this.vis.classed('in-transition', true);
    this._setPosition(
      this.width / 2 - x - width / 2,
      this.height / 2 - y - height / 2
    );
    d3.select(this.refs.svg).selectAll('.selected').classed('selected', false);
    rect.classList.add('selected');
    d3.selectAll(links).classed('selected', true);
  }

  _setPosition(x, y) {
    let {minX, maxX, minY, maxY} = this.state;
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    minX += halfWidth;
    maxX += halfWidth;
    minY += halfHeight * 1.5;
    maxY += halfHeight * .5;
    const newX = Math.min(maxX, Math.max(minX, x));
    const newY = Math.min(maxY, Math.max(minY, y));
    this.navState = {x: newX, y: newY};
    this.vis.style('transform', `translate(${newX}px, ${newY}px)`);
  }

  _redraw() {
    for (const [id, {rect, label, links}] of this.idsToEls.entries()) {
      d3.selectAll([rect, label, ...links])
        .style('opacity', this.conceptsMap.get(id).mastered ? .5 : 1)
    }
  }

}

export default Relay.createContainer(ConceptFlow, {

  fragments: {
    concepts: (vars) => Relay.QL`
      fragment on Concept @relay(plural: true) {
        id
        name
        mastered
        reqs { id }
        container { id }
      }
    `
  }

});
