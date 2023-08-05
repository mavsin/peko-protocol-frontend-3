import { useMemo } from "react";
import { useContractRead } from "wagmi";
import { formatUnits } from "viem";
import Td from "../../../components/tableComponents/Td";
import { IAsset, IReturnValueOfAllowance } from "../../../utils/interfaces"
import { POOL_CONTRACT_ABI, POOL_CONTRACT_ADDRESS } from "../../../utils/constants";
import FilledButton from "../../../components/buttons/FilledButton";

//  ---------------------------------------------------------------------------------------------

interface IProps {
  asset: IAsset;
  ethPriceInUsd: number;
  usdcPriceInUsd: number;
  openDialog: Function;
}

//  ---------------------------------------------------------------------------------------------

export default function DPRow({ asset, ethPriceInUsd, usdcPriceInUsd, openDialog }: IProps) {
  return (
    <tr>
      {/* Token */}
      <Td>
        <div className="flex items-center gap-2">
          <img src={asset.imgSrc} alt={asset.name} className="w-10" />
          <span className="font-bold uppercase">{asset.symbol}</span>
        </div>
      </Td>

      {/* Profit */}
      {/* <Td className="uppercase">{profit} {asset.symbol}</Td> */}

      {/* Profit in USD */}
      {/* <Td>${profitInUsd.toFixed(2)}</Td> */}

      <Td>
        <FilledButton onClick={() => openDialog(asset)}>
          Withdraw
        </FilledButton>
      </Td>
    </tr>
  )
}