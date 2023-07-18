global.configureLambdaInstrumentation = (config) => {
  return {
    ...config,
    disableAwsContextPropagation: true
  }
}
