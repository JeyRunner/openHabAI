#include <iostream>

#include <tensorflow/cc/client/client_session.h>
#include <tensorflow/cc/ops/standard_ops.h>
#include <tensorflow/core/framework/tensor.h>

using namespace std;
using namespace tensorflow;
using namespace tensorflow::ops;


/* -- MAIN PROGRAM ------------------------------------------- */
int main(int argc, char *argv[])
{
  Scope root = Scope::NewRootScope();


  // Matrix A = [3 2; -1 0]
  auto A = Const(root, {{3.f, 2.f}, {-1.f, 0.f}});
  // Vector b = [3 5]
  auto b = Const(root, {{3.f, 5.f}});

  // v = Ab^T
  auto v = MatMul(root.WithOpName("v"), A, b, MatMul::TransposeB(true));


  std::vector<Tensor> outputs;
  ClientSession session(root);


  // Run and fetch v
  TF_CHECK_OK(session.Run({v}, &outputs));

  // Expect outputs[0] == [19; -3]
  cout << outputs[0].matrix<float>();

  return 0;
}