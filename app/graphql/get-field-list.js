import _ from 'lodash';

function getFieldList(context, asts = context.fieldASTs) {
  if (!Array.isArray(asts)) asts = [asts];

  var selections = asts.reduce((selections, source) => {
    selections.push(...source.selectionSet.selections);
    return selections;
  }, []);

  return selections.reduce((list, ast) => {
    switch (ast.kind) {
      case 'Field':
        list[ast.name.value] = ast.selectionSet ?
          getFieldList(context, ast) : true;
        return list;
      case 'InlineFragment':
        return _.merge({}, list, getFieldList(context, ast));
      case 'FragmentSpread':
        return _.merge({}, list,
          getFieldList(context, context.fragments[ast.name.value])
        );
      default:
        throw new Error('Unsuported query selection')
    }
  }, {})
}

export default getFieldList;
