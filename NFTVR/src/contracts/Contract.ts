import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  Account,
  AccountUpdate,
  Provable,
  ZkProgram,
  SelfProof,
  Void,
  Struct,
} from 'o1js';

export class TestStruct extends Struct({
  A: Field,
  B: Field,
  C: Field,
  D: Field,
}) {
  static fromFields(action: Field[]): TestStruct {
    return super.fromFields(action) as TestStruct;
  }
}

export const TestZkProgram1 = ZkProgram({
  name: 'test-zkProgram',
  publicOutput: Field,
  methods: {
    firstStep: {
      privateInputs: [Field],
      method(input: Field): Field {
        return Field(input).add(1);
      },
    },
    createCampaign: {
      privateInputs: [SelfProof<Void, Field>, Field],
      method(preProof: SelfProof<Void, Field>, input: Field): Field {
        preProof.verify();
        return Field(input).add(1);
      },
    },
  },
});

export const TestZkProgram2 = ZkProgram({
  name: 'test-zkProgram',
  publicInput: TestStruct,
  publicOutput: Field,
  methods: {
    firstStep: {
      privateInputs: [Field],
      method(input: TestStruct, input2: Field): Field {
        return Field(input.A).add(1);
      },
    },
    createCampaign: {
      privateInputs: [SelfProof<TestStruct, Field>, Field],
      method(
        input: TestStruct,
        preProof: SelfProof<TestStruct, Field>,
        input2: Field
      ): Field {
        preProof.verify();
        return Field(input.A).add(1);
      },
    },
  },
});

export class A extends SmartContract {
  init() {
    super.init();
  }

  @method setNumberInB(contract: PublicKey, number: Field) {
    let contractB = new B(contract);
    contractB.setNumber(Field(number));
  }
}

export class B extends SmartContract {
  @state(Field) num = State<Field>();
  @state(PublicKey) addressA = State<PublicKey>();

  init() {
    super.init();
  }

  @method setNumber(number: Field) {
    let addressA = this.addressA.getAndRequireEquals();
    let contractA = new A(addressA);
    let update = AccountUpdate.create(addressA, contractA.token.id);
    update.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;
    this.num.set(number);
  }
}
