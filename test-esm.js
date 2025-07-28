console.log('ESM test starting...');

setTimeout(() => {
  console.log('ESM test completed after 2 seconds');
  process.exit(0);
}, 2000);

console.log('Waiting 2 seconds...');