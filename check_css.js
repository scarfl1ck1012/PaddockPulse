const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk('./src', function(err, results) {
  if (err) throw err;
  const jsxFiles = results.filter(f => f.endsWith('.jsx'));
  const missing = [];
  
  for (const file of jsxFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
          if (line.includes('import ') && line.includes('.css')) {
              // Extract the path
              const match = line.match(/import\s+['"]([^'"]+\.css)['"]/);
              if (match) {
                  const cssPath = match[1];
                  const absoluteCssPath = path.resolve(path.dirname(file), cssPath);
                  if (!fs.existsSync(absoluteCssPath)) {
                      missing.push({ from: file, missing: cssPath });
                  }
              }
          }
      }
  }
  
  if (missing.length > 0) {
      console.log("Missing CSS files:");
      missing.forEach(m => console.log(`- ${m.missing} (imported in ${path.relative(process.cwd(), m.from)})`));
  } else {
      console.log("All CSS imports are valid.");
  }
});
