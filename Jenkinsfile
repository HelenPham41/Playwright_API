
pipeline{

agent any

stages{

stage('Install'){
steps{
sh 'npm install'
sh 'npx playwright install'
}
}

stage('Test'){
steps{
sh 'npx playwright test'
}
}

}

}
