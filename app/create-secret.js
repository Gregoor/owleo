require('crypto').randomBytes(48, function(err, buffer) {
  require('fs').writeFileSync(
    require('path').join(__dirname, 'secret.key'),
    buffer.toString('hex')
  );
});
