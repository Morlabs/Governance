import { MOR } from '@/generated-types/ethers';
import { wei } from '@/scripts/utils/utils';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { ethers, expect } from 'hardhat';
import { Reverter } from '../helpers/reverter';

describe('MOR', () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let SECOND: SignerWithAddress;

  let mor: MOR;

  const cap = wei('100');

  before(async () => {
    [OWNER, SECOND] = await ethers.getSigners();

    const MORFactory = await ethers.getContractFactory('MOR');
    mor = await MORFactory.deploy(await OWNER.getAddress(), cap);

    reverter.snapshot();
  });

  afterEach(async () => {
    await reverter.revert();
  });

  describe('constructor', () => {
    it('should set the owner', async () => {
      expect(await mor.owner()).to.equal(await OWNER.getAddress());
    });

    it('should set the cap', async () => {
      expect(await mor.cap()).to.equal(cap);
    });

    it('should set the name and symbol', async () => {
      expect(await mor.name()).to.equal('MOR');
      expect(await mor.symbol()).to.equal('MOR');
    });
  });

  describe('mint', () => {
    it('should mint tokens', async () => {
      const amount = wei('10');

      const tx = await mor.mint(await SECOND.getAddress(), amount);
      await expect(tx).to.changeTokenBalance(mor, SECOND, amount);
    });

    it('should not mint more than the cap', async () => {
      await expect(mor.mint(await SECOND.getAddress(), cap + 1n)).to.be.revertedWith('ERC20Capped: cap exceeded');
    });

    it('should revert if not called by the owner', async () => {
      await expect(mor.connect(SECOND).mint(await SECOND.getAddress(), wei('10'))).to.be.revertedWith(
        'MOR: caller is not the owner'
      );
    });
  });

  describe('burn', () => {
    it('should burn tokens', async () => {
      const amount = wei('10');

      await mor.mint(await OWNER.getAddress(), amount);

      const tx = await mor.burn(amount);

      await expect(tx).to.changeTokenBalance(mor, OWNER, -amount);
    });
  });

  describe('burnFrom', () => {
    it('should burn tokens from another account', async () => {
      const amount = wei('10');

      await mor.mint(await OWNER.getAddress(), amount);

      await mor.approve(await SECOND.getAddress(), amount);

      const tx = await mor.connect(SECOND).burnFrom(await OWNER.getAddress(), amount);

      await expect(tx).to.changeTokenBalance(mor, OWNER, -amount);

      expect(await mor.allowance(await OWNER.getAddress(), await SECOND.getAddress())).to.equal(0);
    });
  });
});

// npx hardhat test "test/tokens/MOR.test.ts"
