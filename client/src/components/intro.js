import React from 'react';
import {Card, CardText, CardTitle} from 'react-mdl';

export default () => (
  <Card>
    <CardTitle>What is Owleo?</CardTitle>
    <CardText>
      Knowledge is quintessentially separable and there is value in that separation.
      That is the hypothesis behind Owleo: Making the structure of knowledge explicit
      and visible, yields several advantages.

      <ol>
        <li>Targeted mastery of concepts</li>
        <li>
          Learn about new concepts without having to rehash known ones
          (Related: Explain stuff once)
        </li>
        <span style={{marginLeft: -15, fontSize: 19}}>
          And some that are not implemented yet:
        </span>
        <li>Facilitating deliberate practice, by identifying your weak spots</li>
        <li>See where your current knowledge could take you</li>
      </ol>

      Newly registered users can only create and vote for explanations. The possibility of changing concepts and their relations, is opened up to users who participate in a meaningful way.
    </CardText>
  </Card>
);