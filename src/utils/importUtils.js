/**
 * Utilitário para importar transações de extratos bancários.
 * Para o MVP, implementamos um parser básico de CSV e simulador de OFX.
 */

export async function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const content = e.target.result
      try {
        let transactions = []
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          transactions = parseCSV(content)
        } else if (file.name.toLowerCase().endsWith('.ofx')) {
          transactions = parseOFX(content)
        } else {
          throw new Error('Formato não suportado. Use CSV ou OFX.')
        }
        
        resolve(transactions)
      } catch (err) {
        reject(err)
      }
    }
    
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'))
    reader.readAsText(file)
  })
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim())
  const transactions = []
  
  // Assume header: Data, Descrição, Valor
  // Ex: 2026-04-24, Uber, -35.50
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Ignorar linhas vazias
    if (!line.trim()) continue
      
    // Tratar vírgulas dentro de aspas num CSV real exigiria uma regex mais complexa,
    // mas para MVP usamos split simples
    const parts = line.split(',')
    if (parts.length >= 3) {
      const dateStr = parts[0].trim()
      const desc = parts[1].trim()
      let amountStr = parts[2].trim().replace('R$', '').replace(',', '.')
      const amount = parseFloat(amountStr)
      
      if (!isNaN(amount)) {
        transactions.push({
          type: amount >= 0 ? 'income' : 'expense',
          amount: Math.abs(amount),
          description: desc,
          date: dateStr.includes('/') ? dateStr.split('/').reverse().join('-') : dateStr, // Converter DD/MM/YYYY para YYYY-MM-DD se necessário
          category: 'other', // Categoria padrão
          isRecurring: false,
        })
      }
    }
  }
  
  return transactions
}

function parseOFX(ofxText) {
  // Parser OFX simplificado (Regex-based para MVP)
  // Um parser real de OFX usaria XML parsing, pois o OFX é baseado em SGML/XML
  const transactions = []
  
  // Procura por blocos <STMTTRN> ... </STMTTRN>
  const trnRegex = /<STMTTRN>[\s\S]*?<\/STMTTRN>/g
  const matches = ofxText.match(trnRegex)
  
  if (matches) {
    matches.forEach(trn => {
      // Extrair Data (<DTPOSTED>)
      const dateMatch = trn.match(/<DTPOSTED>(\d{8})/)
      let date = new Date().toISOString().split('T')[0]
      if (dateMatch) {
        const dStr = dateMatch[1] // YYYYMMDD
        date = `${dStr.substring(0,4)}-${dStr.substring(4,6)}-${dStr.substring(6,8)}`
      }
      
      // Extrair Valor (<TRNAMT>)
      const amountMatch = trn.match(/<TRNAMT>([-\d.]+)/)
      let amount = 0
      let type = 'expense'
      if (amountMatch) {
        const val = parseFloat(amountMatch[1])
        amount = Math.abs(val)
        type = val >= 0 ? 'income' : 'expense'
      }
      
      // Extrair Descrição (<MEMO> ou <NAME>)
      let desc = 'Transação Importada'
      const memoMatch = trn.match(/<MEMO>(.*?)(\r|\n|<)/)
      const nameMatch = trn.match(/<NAME>(.*?)(\r|\n|<)/)
      
      if (nameMatch) desc = nameMatch[1].trim()
      else if (memoMatch) desc = memoMatch[1].trim()
      
      transactions.push({
        type,
        amount,
        description: desc,
        date,
        category: 'other',
        isRecurring: false,
      })
    })
  }
  
  return transactions
}
